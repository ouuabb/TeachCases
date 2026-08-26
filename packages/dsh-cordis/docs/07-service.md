# 07 · service.ts —— Service 抽象基类

> 源码：`vendor/cordis/src/service.ts`（115 行）
> 对应示例：`code/07-service.demo.ts`

插件之间通过 **服务** 协作：提供方继承 `Service`，消费方声明 `inject`。

## 1. 七个静态符号常量（L13-25）

| 常量 | 值（symbols.xxx） | 用途 |
|---|---|---|
| `Service.init` | `init` | 类插件构造后要执行的实例方法 |
| `Service.check` | `check` | 可用性谓词（provide 第三参） |
| `Service.config` | `config` | 幻影类型参数，支撑 intercept 配置类型推断 |
| `Service.invoke` | `invoke` | 让服务可调用（如 `ctx.logger()`） |
| `Service.extend` | `extend` | 派生服务实例 |
| `Service.tracker` | `tracker` | traceable 元数据 |
| `Service.resolveConfig` | `resolveConfig` | intercept 配置合并 |

`[symbols.config]` 只是**类型层面**的幻影字段（L27 `declare`），
运行时不占用。它让 `InjectKey`（registry.ts:22-24）能挑出"带拦截配置的服务"，
并给 `ctx.intercept('logger', {...})` 正确的参数类型。

## 2. 构造函数流程（L42-59）

```ts
constructor(protected ctx: Context, name: string) {
  name ??= this.constructor['provide'] as string      // 缺省用静态 provide
  const tracker = { associate: name, property: 'ctx' }
  if (self[symbols.invoke]) {
    self = createCallable(name, joinPrototype(proto, Function.prototype), tracker)
    // 可调用服务：实例同时是函数
  }
  self.ctx = ctx
  self.name = name
  defineProperty(self, symbols.tracker, tracker)
  self.ctx.reflect.provide(name, self, this[symbols.check])   // 注册即 effect
  return self                                               // 可能返回 proxy
}
```

要点：

- `associate: name` —— 服务实例的 `foo` 属性会转发到 `ctx['name.foo']`
- 有 `[invoke]` 时实例变成函数（`createCallable`，utils.ts:226），
  logger 服务就是这么干的
- **注册走 `ctx.reflect.provide`**，所以服务随提供者 fiber 卸载自动消失
- 构造函数**返回 self**（可能是被包装的 callable proxy）

## 3. [symbols.filter]（L61-63）

```ts
return ctx[symbols.isolate][this.name] === this.ctx[symbols.isolate][this.name]
```

服务相关事件（如 `internal/service`）只投递给**同一 isolate 作用域**的
监听者——隔离墙的又一道闸门。

## 4. [symbols.resolveConfig] —— intercept 合并（L86-102）

```ts
let intercept = this.ctx[Context.intercept]
while (this.name in intercept) {
  if (hasOwn) configs.unshift(intercept[this.name])   // 越靠近根的越先收集
  intercept = getPrototypeOf(intercept)
}
if (base) configs.unshift(base)
if (head) configs.push(head)
return this['Config']?.merge ? this['Config'].merge(...configs)   // 深度合并
                                : Object.assign({}, ...configs)   // 浅合并
```

语义：`ctx.intercept('name', cfg)` 在**子树**里给该服务注入默认配置；
祖先条目先应用、`base` 垫底、`head` 置顶。logger 的默认名/级别就靠它。

## 5. Symbol.hasInstance（L104-114）

`instanceof Service` 会沿实例的构造链（可能被 proxy 包裹）回溯查找，
确保 traceable 包装后的实例仍能通过 `instanceof` 判断。

## 6. 与 npm peerDependencies 的对比

| | inject / Service | peerDependencies |
|---|---|---|
| 数量 | 一对多（可多个插件提供同一服务名） | 一对一 |
| 缺失时 | 依赖者不激活，不崩溃 | 安装期即报错 |

所以插件包只需对"**从依赖里导入代码**"的包声明 peerDependencies，
纯类型/纯服务依赖用 `inject` + devDependencies 即可。

## 示例演示什么

`code/07-service.demo.ts`：自定义 Service 子类（构造注册、inject 消费）；
`check` 谓词控制可用性；callable service（`[invoke]`）；intercept 配置合并；
子类插件化（class 插件就是 Service）。
