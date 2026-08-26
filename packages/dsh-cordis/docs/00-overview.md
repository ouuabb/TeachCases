# 00 · 架构总览：五大内部服务与启动流程

> 源码范围：`vendor/cordis/src/` 全部 9 个文件（约 2700 行）
> 对应示例：`code/00-bootstrap.demo.ts`

## 一句话定位

DSH 的 Cordis 是一个 **微内核插件运行时**：核心只管"插件的装载/卸载、服务解析、事件分发"，
其余一切能力（包括日志输出本身）都是挂载在 Context 上的服务或插件。

## 文件依赖图

```
            utils.ts  ←── 所有文件都依赖它
           /    |    \
   context.ts fiber.ts events.ts
       \       |       /
        reflect.ts  registry.ts
             \       /
             service.ts
             
   logger.ts ── 独立门面，依赖 utils + context 类型
   index.ts  ── 导出聚合
```

- `utils.ts` 是零依赖底座（只借 cosmokit 的 `defineProperty`）
- `context.ts` 组合了四个服务的构造，但不知道它们的实现细节
- `fiber.ts` 与 `events.ts` 互相引用（事件监听器是 effect；状态变化发事件）

## 五大内部服务

`new Context()` 时（`context.ts:71-84`）按以下顺序安装：

| 服务 | 属性 | 职责 | 源码 |
|---|---|---|---|
| Fiber | `ctx.fiber` | 插件生命周期状态机 + effect 副作用回收 | `fiber.ts:184` |
| ReflectService | `ctx.reflect` | 服务注册表 + Context Proxy 的陷阱处理器 | `reflect.ts:133` |
| RegistryService | `ctx.registry` | 插件注册表，`ctx.plugin()` 入口 | `registry.ts:195` |
| EventsService | `ctx.events` | 事件总线（五种分发模式） | `events.ts:131` |
| LoggerService | `ctx.logger` | 可调用日志服务 | `logger.ts:194` |

注意两点：

1. **Fiber 最先创建**——根 Fiber 是特例（`runtime = null`），直接进入 `ACTIVE`
   状态（`fiber.ts:320-332`），uid 固定为 0。它的 `dispose` 就是 `restart`。
2. 构造最后执行 `this.fiber._disposables.clear()`（`context.ts:82`）：
   四个服务的构造函数会注册一些全局性 effect（如 mixin），这些不属于任何插件，
   需要从根 Fiber 的回收列表里清掉，避免根被"卸载"时误删基础设施。

## Context 是一个 Proxy

```ts
const self = new Proxy<this>(this, ReflectService.handler)   // context.ts:74
this.root = self
return self                                                  // 构造器返回代理
```

从此所有 `ctx.xxx` 读取都经过 `ReflectService.handler.get`（`reflect.ts:136`）：
先查特殊属性 → 再查自有属性 → 最后走服务解析链。
这就是"`ctx.db` 这个没定义过的属性为什么能安全访问"的答案。

## 一次插件加载的全链路

```
ctx.plugin(P, config)                    registry.ts:316
 ├─ resolve(P)                           三种形态归一成 callback 函数
 ├─ runtime 复用（同一 callback 只有一份 Runtime 记录）
 ├─ new Fiber(ctx, config, Inject.resolve(inject), runtime, stack)
 │   ├─ ctx = parent.extend({ fiber })          fiber.ts:236
 │   ├─ inject 的非空 config 写入子 ctx intercept  fiber.ts:240-245
 │   ├─ dispose = parent.fiber.effect(...)       ★ 子 fiber 生命周期是父的 effect
 │   ├─ emit 'internal/plugin'                   fiber.ts:302
 │   └─ 逐个 _checkImpl(name) + _refresh()       fiber.ts:314-319
 ├─ _refresh 计算 epoch                          fiber.ts:611
 │     epoch = ':' + uid1 + ':' + uid2 + ...     （依赖提供者的 uid 序列）
 │     缺任何一个依赖 → INACTIVE → 保持 PENDING
 └─ _setEpoch(epoch) → _reload()
      ├─ waterfall('internal/config') 解析懒配置    fiber.ts:641
      ├─ resolveConfig(schema 校验)                fiber.ts:50
      └─ _execute(runner) → apply(ctx, config) / new Ctx(config)
            └─ 插件体里注册的每个 ctx.on/provide/plugin 都是 effect
               → ACTIVE
```

**关键设计：epoch 响应式重载**（`fiber.ts:611-639`）

epoch 把"我依赖的服务当前由哪些 fiber 提供"编码成一个字符串。
任何服务出现/消失（`reflect.notify` → `_checkImpl` + `_refresh`）都会重算 epoch：

- 依赖齐了（INACTIVE → 具体值）：自动加载
- 依赖断了（→ INACTIVE）：自动卸载
- 依赖换了提供者（uid 变了）：先卸载再加载 —— **替换服务 = 自动重启**

这就是"时空可组合"中时间维度的实现核心。

## DSH 相对上游的本地增强（vendor README 第 6/7/15 条）

阅读源码时会看到一些明显防御性的代码，它们来自 DSH 的本地修改：

1. **fiber 生命周期加固**（`fiber.ts` 大量注释处）：
   - effect 的 owner-list 包装先注册再执行 setup 体（`fiber.ts:520`），
     重入卸载时能看到尚未执行完的 effect
   - setup 同步失败时回滚已收集的清理函数并移除包装（`fiber.ts:523-537`）
   - `UNLOADING` 中禁止新建 effect（`fiber.ts:420`）
2. **懒配置求值**（`_resolveConfig`, `fiber.ts:641`）：
   raw config 先保留在 `_config`，等注入的服务全部激活后才经
   `internal/config` waterfall 解析——配置里可以安全引用运行时服务
3. **JSDoc 全量补全**：仅注释变更，网站 API 文档生成用

## 示例演示什么

`code/00-bootstrap.demo.ts` 复现启动流程：手动按同样顺序安装服务、观察根
Fiber 的特例形态、验证 `internal/status` / `internal/plugin` 两个生命周期事件。
