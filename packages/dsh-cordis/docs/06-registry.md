# 06 · registry.ts —— 插件注册表与依赖注入

> 源码：`vendor/cordis/src/registry.ts`（337 行）
> 对应示例：`code/06-registry.demo.ts`

## 1. 插件三种形态（L92-133）

```ts
type Plugin = Plugin.Function | Plugin.Constructor | Plugin.Object
```

| 形态 | 判定 | 示例 |
|---|---|---|
| 函数 | `typeof plugin === 'function'` | `(ctx, config) => {...}` |
| 类构造 | `isConstructor`（utils.ts:79） | `class P { constructor(ctx, config){} }` |
| 对象 | `object && typeof apply === 'function'` | `{ name, inject, apply(ctx, config){} }` |

每种形态都可携带 `Plugin.Base` 元数据（L100-111）：

- `name` —— 显示名（fiber 诊断、日志名）
- `Config` —— standard-schema 校验器
- `inject` —— 依赖声明
- `provide` —— 声明提供哪些服务（loader 元信息用）
- `intercept` —— 声明消费哪些服务的 intercept 配置

`Transform`（L113-118）：`{ schema: true, Config: (s)=>t }` 标记型配置转换。

`resolve()`（L222-228）把三种形态统一成执行 callback（对象取 `apply`），
这也是 registry 内部的**身份 key**。

## 2. Runtime 记录：一对多（L136-145）

```ts
interface Runtime {
  name?: string
  fibers: DisposableList<Fiber>   // 同一插件所有实例
  callback: Function               // registry 身份 key
  Config?: StandardSchemaV1
}
```

同一 callback 重复 `ctx.plugin()` → 复用同一个 Runtime，各起一个 Fiber。
最后一个 fiber 移除时 Runtime 记录才删除（fiber.ts:270-274）。

## 3. Inject 声明与 resolve（L19, L71-88）

```ts
type Inject = string[] | { [name]: config? }
```

`Inject.resolve(inject, result)` 归一化成 `{ name: config|null }` 映射：
- 数组 → 每项 `null`（只要服务在，不带拦截配置）
- 对象 → 每项 `值 ?? null`
- 带 `checkProto` 标记的类级 inject → **先递归合并原型链再覆盖 own**
  （子类继承父类依赖，`@Inject` 装饰器打的标记，L42）

## 4. @Inject 装饰器（L37-60）

**类级**：往类静态 `inject` 写入依赖（并标记 checkProto 支持继承）。
**方法级**：方法体不立即执行，被包成 `ctx.inject(inject, ctx => ...)`
注册为子插件——等依赖就绪才执行，卸载自动回收（addInitializer 里挂
initHooks，fiber.ts:254-256 会逐个执行）。

## 5. RegistryService 主流程（L195-336）

`plugin(plugin, config)`：

```
resolve(plugin) → 非法形状抛 "invalid plugin, expect ..."
ctx.fiber.assertActive()                 // disposed 后禁止再装
runtime = _internal.get(callback) ?? 新建（name 处理 L325: 'apply'→undefined）
new Fiber(ctx, config, Inject.resolve(plugin.inject), runtime, stack)
wrapped = Object.create(fiber)
wrapped.then = (res, rej) => fiber.await().then(res, rej)   // ★
return wrapped                          // Fiber & PromiseLike<Fiber>
```

**awaitable fiber**：`await ctx.plugin(P, cfg)` 会等到加载完成，
启动/校验失败则 reject——这是 03 章 demo 里拿到启动错误的通道。

`inject(deps, callback)`（L300-302）是 `plugin({inject, apply, name})` 的语法糖。

map 式 API：`size / has() / get() / delete() / keys() / values() / entries() / forEach()`。
`delete(plugin)` 会 dispose 该插件**所有** fiber 并移除 Runtime（L258-267）。

## 示例演示什么

`code/06-registry.demo.ts`：三种形态注册与 name 解析；inject 数组/对象
（required/optional）；@Inject 类级+方法级；awaitable fiber 与启动失败
reject；registry 遍历与 delete 批量卸载。
