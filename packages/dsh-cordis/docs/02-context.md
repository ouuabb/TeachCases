# 02 · context.ts —— Proxy 容器与三个派生方法

> 源码：`vendor/cordis/src/context.ts`（146 行）
> 对应示例：`code/02-context.demo.ts`

整个文件只有两样东西：`Context` 接口（公共类型面）和 `Context` 类（146 行的实现）。
但它定义了 Cordis 世界观的全部骨架。

## 1. interface Context —— 声明合并的公共面（L16-33）

```ts
export interface Context {
  [symbols.isolate]: Dict<symbol>   // 隔离映射: 服务名 → 作用域标签
  [symbols.intercept]: Dict         // 拦截映射: 服务名 → 注入配置
  root: this                        // 根上下文（所有子 ctx 共享）
  baseUrl?: string                  // loader 解析相对路径用
  events / logger / reflect / registry
}
```

注意 `fiber` 不在这里——它由 `fiber.ts:9-14` 通过 `declare module './context.ts'`
补充进来。**Context 的公共面是所有核心文件各自"贡献"的**，这是模块增强的典型用法：
每个服务文件声明自己暴露在 ctx 上的属性，最终拼出完整的 Context 类型。

## 2. 跨副本 brand 检查：Context.is()（L61-68）

```ts
static is(value) { return !!value?.[Context.is as any] }
static {
  Context.is[Symbol.toPrimitive] = () => Symbol.for('cordis.is')
  Context.prototype[Context.is as any] = true
}
```

很巧的技巧：把静态方法 `Context.is` 本身当作属性键使用。
读 `value[Context.is]` 时键会先被 `Symbol.toPrimitive` 转换成全局符号
`Symbol.for('cordis.is')`，而 Context 原型上恰好以这个符号存了 `true`。

效果：判断一个对象是不是 context，不靠 `instanceof`（跨 realm / 多副本失效），
而靠全局符号 brand。DSH 的 harness 代码里大量使用 `Context.is()` 做守卫。

## 3. 构造流程（L71-84）

```
初始化两张空映射(isolate/intercept)
→ this 包一层 ReflectService.handler 代理
→ self.root = self
→ new Fiber(self, {}, {}, null, ...)      ← 根 Fiber，runtime=null
→ new ReflectService(self)                ← 内部完成四组 mixin
→ new RegistryService(self)
→ new EventsService(self)                 ← 内部预挂 internal/update 分发器
→ new LoggerService(self)
→ this.fiber._disposables.clear()         ← 清掉构造期收集的 effect
→ return self                             ← 返回代理而非原始 this
```

构造期注册的 mixin/accessor 是**基础设施**，不属于任何插件，
所以最后要从根 fiber 的回收列表里清掉。

## 4. extend(meta) —— 原型链派生（L99-107）

```ts
const self = Object.create(getTraceable(this, this))
for (prop of ownKeys(meta)) defineProperty(self, prop, ...)
```

- 子上下文 = 以父为原型的新对象 → **O(1) 创建成本**
- `meta` 的自有属性遮蔽继承来的同名属性
- 父上下文完全不被修改
- 若当前已是影子上下文（带 `[symbols.shadow]`），会再包一层保持影子传递

`ctx.plugin()` 内部就是 `parent.extend({ fiber })`（`fiber.ts:236`）——
每个插件拿到的 `ctx` 都是这样一个一次性子上下文。

## 5. isolate(name, label?) —— 服务作用域隔离（L121-125)

```ts
const shadow = Object.create(this[symbols.isolate])
shadow[name] = label ?? Symbol(name)
return this.extend({ [symbols.isolate]: shadow })
```

isolate 映射本身也走原型链继承：子作用域查不到的标签沿原型向上找。
两个语义：

1. **隔离**：默认每次传新 symbol → 返回的子树里，`name` 服务的读写
   解析到全新作用域，与外部同名服务互不可见
2. **合并**：两处 `isolate('db', sameLabel)` → 两棵子树共享同一作用域，
   provider 和 consumer 可以分属两棵子树（agent preset 就靠这个让
   provider 与消费者共享同一 isolate realm）

服务解析时（`reflect.ts:164`）一旦发现某层祖先的 isolate 标签与请求的不一致，
立刻停止上行并抛错——这就是隔离"墙"。

## 6. intercept(name, config) —— 服务配置注入（L141-145)

结构上和 isolate 一模一样（原型链 + 自有覆盖）。
语义：在此子树下启动的插件，读取该服务时，会把沿途收集到的 intercept 配置
合并进服务的解析配置（见 `service.ts:86` 的 `[symbols.resolveConfig]`）。

三个方法共同构成"**不可变派生**"风格：永远返回新对象，从不改父级。

## 示例演示什么

`code/02-context.demo.ts`：

- 未注入就访问服务 → 还原 `cannot get property "x" without inject` 报错样式
- extend 遮蔽与 O(1) 原型共享
- isolate 默认隔离 vs 同 label 合并（同名服务两个实现共存、互不串扰）
- intercept 给 logger 注入名字前缀，验证只影响子树
