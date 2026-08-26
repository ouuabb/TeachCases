# 09 · index.ts 与综合实战 —— 一个 mini-agent

> 源码：`vendor/cordis/src/index.ts`（导出面）
> 对应示例：`code/09-mini-agent.demo.ts`

## 1. 导出全景

`index.ts` 一行注释 + 一组 `export *`，暴露以下公共面：

| 模块 | 主要导出 |
|---|---|
| `./context.ts` | `Context`（类 + 接口）、`Context.is` brand |
| `./events.ts` | `EventsService`、`Events` 接口、`DispatchMode`、`isBailed`、`EventOptions`、`Hook`、类型工具 |
| `./fiber.ts` | `Fiber`、`FiberState`、`CordisError`、`ValidationError`、`resolveConfig`、`Effect`/`Disposable`/`EffectMeta` |
| `./logger.ts` | `Logger`、`LoggerService`、`Message`、`Exporter`、`LoggerLevel`、`defaultFormatters`、`c16`/`c256` |
| `./registry.ts` | `RegistryService`、`Plugin`、`Inject`（类型+命名空间）、`InjectKey`、`@Inject` 装饰器 |
| `./service.ts` | `Service`（抽象基类） |
| `./utils.ts` | `DisposableList`、`symbols`、`getTraceable`、`createCallable`、`composeError`、`isConstructor`… |

## 2. 概念如何协同 —— 一张全景时序

```
用户调 ctx.plugin(agentPlugin, {model})
  │
  ├─ registry.resolve + runtime 复用（06）
  ├─ new Fiber(ctx, config, Inject.resolve(inject), runtime)（03）
  │    ├─ ctx = parent.extend({fiber})（02）
  │    ├─ dispose = parent.fiber.effect(...)（03/01）
  │    └─ emit internal/plugin → _checkImpl ×N（05/04）
  ├─ epoch: ':'+llmUid+':'+toolsUid（03）
  ├─ 服务就绪 → _reload → waterfall internal/config（04）
  │    └─ resolveConfig(schema) 校验（03）
  └─ _execute → apply(ctx, config)
        ├─ provide('tools')（05/07）
        ├─ ctx.on('agent/tool-call', ...)（04）
        └─ ctx.effect(...)（03）
  之后任何提供者变动 → notify → epoch 变化 → 自动重启（05）
```

从使用者视角：**注册（registry）→ 状态机（fiber）→ 服务解析（reflect）
→ 事件协作（events）→ 配置校验（fiber.resolveConfig）→ 日志（logger）**。

## 3. mini-agent 案例设计

`code/09-mini-agent.demo.ts` 用一个可运行的迷你 agent 证明这些概念够用：

| 组件 | 用到的概念 |
|---|---|
| `tools` 服务（继承 Service） | 07 Service 构造注册、05 provide |
| `llm` 服务 | 同上，模拟 chat() |
| `agent` 插件 | 03 inject 依赖 + 06 对象插件 + 02 ctx |
| 工具注册/注销 | 03 effect 生命周期（重启即重注册） |
| `agent/tool-call` waterfall | 04 洋葱：审计层 → 执行层 → 权限否决短路 |
| `Config` schema | 03 ValidationError |
| `update()` 热更新 | 03 internal/update waterfall |
| exporter 日志 | 08 门面 |

演示路径：启动 → 注册两工具 → 调用 read-file/calc → 权限否决 → 热更新换
model（工具随旧 fiber 自动注销、新 fiber 重注册）→ 优雅停机确认零残留。