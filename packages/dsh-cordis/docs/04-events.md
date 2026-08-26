# 04 · events.ts —— 五种分发模式与内部事件

> 源码：`vendor/cordis/src/events.ts`（352 行）
> 对应示例：`code/04-events.demo.ts`

## 1. 五种分发模式（L32）

| 模式 | await？ | 顺序 | 返回值 | 语义 |
|---|---|---|---|---|
| `emit` | 否 | 注册序同步执行 | 无 | 纯通知；返回的 promise 被忽略 |
| `parallel` | 是 | 并发 | AggregateError(如有错) | `Promise.allSettled` 收齐，任一失败聚合抛出 |
| `serial` | 是 | 注册序逐个 | 首个 bail 值 | 前一个完成才跑下一个 |
| `bail` | 否 | 注册序同步 | 首个 bail 值 | serial 的同步版 |
| `waterfall` | 否 | 外→内洋葱 | 最外层返回值 | 环绕中间件 + 否决权 |

**bail 判定**（L13）：`value !== null && !== false && !== undefined`——
即返回 `null / false / undefined` 都算"没拦住"，其余任何值都短路。

## 2. dispatch：监听器解析与过滤（L165-175）

所有模式共用一条解析路径：

```
args[0] 是 object/function → 弹出作为 thisArg
internal/* 事件不再广播 internal/dispatch（防递归）
filter = thisArg?.[Context.filter]
hooks.filter(hook => hook.global || !filter || filter.call(thisArg, hook.ctx))
```

两个过滤维度：

- **hook.global**：注册时声明"无视过滤器"，全局监听器永远收到
- **thisArg[Context.filter]**：派发方可以携带过滤函数，
  按监听器注册时所在 ctx 决定是否投递。
  Service 用它实现"只有同一 isolate 作用域内的实例才收到服务事件"
  （`service.ts:61-63`）；`reflect.notify` 也用它按作用域定向发
  `internal/service`（`reflect.ts:330-334`）

注意细节：`parallel` 上报给 `internal/dispatch` 的 mode 也是 `'emit'`
（L184 直接复用）——内部诊断只区分"是否 waterfall 类"。

## 3. waterfall 洋葱语义（L234-243）

```ts
const cbs = this.dispatch('waterfall', args)
const inner = args.pop()          // 最后一个参数是内建行为 next
const next = () => {
  const cb = cbs.shift() ?? inner // 监听器耗尽后落到内建行为
  return cb(...args)              // args 已含 next
}
args.push(next)
return next()
```

- 监听器签名 `(...args, next)`；调用 `next()` 进入下一层
- **不调 next() = 否决**，包括否决内建行为（如 `update` 的重启）
- 要让调用方拿到结果/等完成，必须 `return next()`（03 章 demo 的教训）
- `prepend: true` 把监听器放到最外层

## 4. on / once / register 与自动注销（L254-318)

`on()` 流程：

1. options 归一化（布尔 → `{prepend}`）
2. `assertActive()` —— disposed 后注册直接抛错
3. `listener = reflect.bind(listener)` —— trace 包装，见 05 章
4. **bail `internal/listener`**：任何监听器可拦截并替换注册行为。
   EventsService 自己就在这里做了特判（L140-146）：
   名字为 `internal/update` 且非 global 的监听器不进公共表，
   改存到**当前 fiber 的 `_hooks['internal/update']`**
5. 正常路径：`register(label, hooks, callback, options)` → 一个 effect，
   卸载时自动反注册

`internal/update` 的两级设计值得体会：

- 全局常驻分发器（L148-155，global+prepend）把事件转交给
  "正在被 update 的那个 fiber"自己的监听器列表
- 于是每个插件只会收到**关于自己**的更新事件——
  03 章 demo 里 `pluginCtx.on('internal/update', ...)` 能精确否决自身重启

## 5. 内部事件一览（Events 接口，L329-352）

| 事件 | 模式 | 触发点 | this |
|---|---|---|---|
| `internal/plugin` | emit | Fiber 创建/uid 清除（fiber.ts:269,302） | - |
| `internal/status` | emit | 状态迁移（fiber.ts:586） | - |
| `internal/config` | waterfall | 激活前解析 raw config（fiber.ts:642） | Fiber |
| `internal/service` | emit | 服务可用性变化（reflect.ts:333） | Context |
| `internal/update` | waterfall | fiber.update()（fiber.ts:748） | Fiber |
| `internal/get` | waterfall | Proxy 读未命中（reflect.ts:153） | - |
| `internal/set` | waterfall | Proxy 写服务（reflect.ts:191） | - |
| `internal/listener` | bail | ctx.on 注册时（events.ts:296） | Context |
| `internal/dispatch` | emit | 非 internal 事件派发前（events.ts:169） | - |

这是插件作者做**深度集成**的全部官方挂点；
loader/HMR 就是靠 `internal/update` 实现配置热替换与重启接管。

## 示例演示什么

`code/04-events.demo.ts`：五种模式同一组监听器的行为对比；
bail 判定的边界值；waterfall 洋葱与短路；prepend/global 过滤；
once；通过 internal/dispatch 观察总线。
