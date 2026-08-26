# 05 · reflect.ts —— 服务反射层

> 源码：`vendor/cordis/src/reflect.ts`（418 行）
> 对应示例：`code/05-reflect.demo.ts`

`ctx.foo` 为什么能安全访问？注册的服务怎么消失？这一章是答案。

## 1. Proxy 陷阱：get 的完整解析链（L135-171）

每次读 `ctx.xxx` 都进 `get`：

```
特殊属性(symbol/prototype/then/数字串/_开头) → 直通         L137
自有属性(当前上下文直接有) → getTraceable 包装返回          L140
否则:
  accessor → def.get.call(ctx, receiver, error)            L149
  根上下文(runtime=null) → 宽松返回 ctx.reflect.get(prop,false) L152
  插件上下文 → waterfall('internal/get') 默认分支:
     key = isolate[prop]                                   L154
     fiber = (shadow ?? ctx).fiber                          L155
     循环: fiber.store?.[prop] 有 → getTraceable 返回       L157-158
           prop in fiber.inject → "inactive context" 抛错   L159-162
           无 runtime → 抛                                  L163
           父层 isolate 标签不一致 → 抛（隔离墙）             L164
           上行到父 fiber                                    L165
```

被 catch 的 `error` 走 `enhanceError`（L73-78）：把 stack 前两行替换成
`Error: <message>`，让报错像原生属性访问失败一样干净。

`set`（L173-197）与 `has`（L199-205）同理：set 先查 `props` 声明，
未声明且非根上下文直接抛 `cannot set property "x" without provide`；
`has` 返回"自有属性或已声明"。

## 2. 两张核心表（L209-211）

- `store: Dict<Impl, symbol>` —— 按 **isolation 标签** 键控的实现表
  `Impl = { name, fiber, value?, check? }`（L116-125）
- `props: Dict<Property>` —— 已声明的上下文属性
  `Property = { type: 'service' } | { type: 'accessor', get, set? }`（L97-113）

## 3. provide —— 服务的注册本身就是 effect（L277-305)

```ts
return this.ctx.fiber.effect(() => {
  if (!this.props[name]) this.props[name] ??= { type: 'service' }
  else if (this.props[name].type !== 'service') throw ...   // 与 accessor 撞名
  this.ctx.root[symbols.isolate][name] ??= Symbol(name)      // 根映射分配标签
  const key = this.ctx[symbols.isolate][name]
  if (this.store[key]) throw `service "${name}" has been registered at <...>`
  this.store[key] = impl; this.ctx.fiber.store![name] = impl
  if (state === ACTIVE) this.notify([name])
  return async () => {                                      // disposer
    delete this.store[key]
    const fibers = this.notify([name])                      // 唤醒依赖者
    await Promise.allSettled(fibers.map(f => f.await()))    // 等它们重载完
    delete this.ctx.fiber.store![name]                      // 最后清自己
  }
}, `ctx.provide("name")`)
```

三个关键点：
1. 服务生命周期 = 提供者 fiber 的生命周期，卸载自动消失
2. **同 scope 重复注册会抛错**——根/子作用域同名只允许一个实现
3. disposer 先删全局 store 再 notify，**最后才删自己 fiber 的 store**，
   保证依赖者在清理期间还能读到旧实现（"ensure self access"）

## 4. notify —— 响应式重载的发动机（L314-336）

```ts
for (const runtime of this.ctx.registry.values())       // 所有插件运行时
  for (const fiber of runtime.fibers)                   // 所有实例
    for (const name of names)
      if (name in fiber.inject && filter(fiber.ctx, name)) {
        fiber._checkImpl(name); hasUpdate = true
      }
    if (hasUpdate) fiber._refresh()                     // 重算 epoch
// 然后带 filter 的上下文发 internal/service 事件
```

- `filter` 默认限制在同一个 isolate 作用域（L314）
- `_checkImpl` 重查依赖实现，`_refresh` 重算 epoch → 触发加载/卸载（fiber.ts:611）
- **替换提供者 = 依赖者自动重启**：这正是 03 章 epoch 的另一半

## 5. accessor 与 mixin（L345-390）

- `accessor(name, {get,set?})`：注册计算属性，卸载自动移除，重复声明抛错
- `mixin(source, mixins)`：把源服务的若干成员转发到 ctx 上。
  用 **generator effect** 逐个 `yield self.accessor(...)`（L366）；
  get 里 `withProps(receiver, service)`（utils.ts:128）让方法的 `this`
  既带调用方 ctx 属性又能转发服务字段；函数 `bind(mixin)`。
  框架自身的四组 mixin 在构造时建立（L219-222）：
  `ctx.on` → `events.on`、`ctx.plugin` → `registry.plugin`、
  `ctx.effect` → `fiber.effect`、`ctx.provide` → `reflect.provide`……

## 6. get / set / trace / bind（L233-243, 254-265, 398-417)

- `get(name, strict=true)`：**不需要 inject 的读取**；strict 要求提供者 fiber 是 ACTIVE
- `set(name, value)`：只能由提供该服务的 fiber 覆写，跨 fiber 抛
  `cannot set property "x" in multiple fibers`（服务归属权硬约束）
- `trace(value)`：给值套 traceable 包装（utils.ts:117）
- `bind(callback)`：代理回调，调用时 `this` 与参数全部过 trace

## 示例演示什么

`code/05-reflect.demo.ts`：报错样式三连（无 inject / 跨 fiber set / 重复 provide）；
provide 生命周期与依赖者自动重载；accessor 计算属性；自定义 mixin 转发。
