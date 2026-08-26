# 01 · utils.ts —— 零依赖底座

> 源码：`vendor/cordis/src/utils.ts`（287 行）
> 对应示例：`code/01-utils.demo.ts`

本文件没有任何框架语义，但整个框架的"魔法"原料都在这里：
全局符号表、可逆容器、traceable 代理家族、长栈拼接。

## 1. DisposableList —— O(1) 删除的可逆列表（L5-40）

effect 系统的存储基础。三张数据结构配合：

```
sn  自增序号
map  Map<序号, 值>        保持插入顺序，迭代即注册序
weak WeakMap<值, 序号>    反向索引 → delete(value) O(1)
```

- `push(value)` 返回一个**删除器闭包**——effect 的 disposer 就是它
- `clear()` 返回**逆序**的值数组（`values.reverse()`），
  这正是"卸载时按注册的逆序执行清理"的实现来源（`fiber.ts:676`）

## 2. symbols —— 全局符号表（L50-73)

全部用 `Symbol.for('cordis.*')` 注册在**全局符号注册表**里：

- 内部符号：`shadow / receiver / original / metadata / initHooks / checkProto`
- Context 符号：`effect / filter / isolate / intercept`
- Service 符号：`init / check / config / invoke / extend / tracker / resolveConfig`

用全局符号而非普通属性名的好处：

1. 不会与插件对象上的任意属性撞名
2. **跨副本一致**——即使页面里加载了两份 cordis，brand 检查依然互通

其中最核心的是 `symbols.shadow`：标记"这是一个 traceable 影子上下文"。

## 3. isConstructor / joinPrototype（L79-99）

- `isConstructor(func)`：箭头函数/async 函数没有 `prototype` → false；
  生成器函数 → false。registry 用它决定插件是 `new callback()` 还是直接调用
- `joinPrototype(proto1, proto2)`：递归合并两条原型链，`proto1` 的描述符优先。
  Service 构造可调用实例时用它把服务方法挂到函数上（`service.ts:51`）

## 4. traceable 代理家族（L116-233）—— 本文件最难的部分

解决的问题：**服务方法被传递出去后，调用时的 `ctx` 应该是谁？**

例：插件 A 里拿到 `const tools = ctx.tools` 并存进全局；
后来插件 B 调用 `tools.register()` 时，副作用应该记在 B 的 fiber 上。

四个角色分工：

| 函数 | 职责 |
|---|---|
| `getTraceable(ctx, value)` | 入口：有 `[symbols.tracker]` 元数据才包装；已是影子则解包（L117-125） |
| `createTraceable(ctx, value, tracker)` | get/set/apply 三陷阱代理（L165） |
| `createShadow(ctx, target, property, receiver)` | 制造影子 ctx：`ctx.extend({ [symbols.shadow]: origin })`（L149） |
| `createShadowMethod` | 方法调用时若 `thisArg === 外层代理` 则换成影子 ctx 作 this（L156） |

`Tracker = { associate?, property?, noShadow? }`：

- `property: 'ctx'` —— 读代理对象的 `.ctx` 属性时返回**调用方的 ctx**
- `associate: 服务名` —— `proxy.foo` 转发到 `ctx['服务名.foo']` 的 accessor
- `noShadow: true` —— 身份敏感的服务（logger 要用原始 fiber 推导名字）
  不剥离影子；其余服务剥掉，让副作用绑定到调用方（L170 注释）

`applyTraceable`（L220）：如果目标带 `[Service.invoke]`（可调用服务如 `ctx.logger()`），
调用体完全交给 invoke 符号上的函数。

`createCallable(name, proto, tracker)`（L226）：造一个"看起来像函数、
实际每次调用都重新 trace 再走 invoke"的服务壳。

## 5. composeError / buildOuterStack —— 异步长栈拼接（L235-287）

问题：`await` 之后抛出的错误，栈里只剩 Promise 内部帧，看不到业务调用点。

方案：

- `buildOuterStack(offset)` 在**同步时刻**捕获一次调用栈存起来（惰性求值）
- `composeError(callback, getOuterStack)` 执行回调：
  - 同步 throw 或 promise reject 时，`handleError` 把外层栈帧
    **拼接进 reason.stack**（找到内层栈第 3 行在外层栈中的位置后 splice）
- `_execute`（`fiber.ts:358`）和 `_unload`（`fiber.ts:678`）都用它包裹，
  所以 effect 清理函数抛错时你能看到完整的因果链

## 示例演示什么

`code/01-utils.demo.ts`：DisposableList 的逆序 clear；全局符号跨副本一致；
joinPrototype 合并；用 createCallable + symbols.invoke 手搓一个可调用对象；
对比原生 async 错误栈与 composeError 处理后的栈。
