# 03 · fiber.ts —— 插件生命周期状态机与 effect 系统

> 源码：`vendor/cordis/src/fiber.ts`（754 行，全框架最大文件）
> 对应示例：`code/03-fiber.demo.ts`

一个插件实例 = 一个 Fiber。它回答三个问题：
**什么时候启动？注册的资源怎么回收？服务变化后怎么自动重载？**

## 1. FiberState 六态状态机（L147-154）

```ts
PENDING → LOADING → ACTIVE
                ↘ FAILED
ACTIVE/PENDING → UNLOADING → DISPOSED
```

| 态 | 数值 | 含义 |
|---|---|---|
| PENDING | 0 | 已创建，但所需服务未就绪；不执行 apply，不阻止进程退出 |
| LOADING | 1 | apply（或类构造）正在执行 |
| ACTIVE | 2 | 加载完成，副作用已注册 |
| FAILED | 3 | apply 或配置校验抛错 |
| DISPOSED | 4 | uid=null，不可重启 |
| UNLOADING | 5 | disposer 正在逆序执行 |

每次迁移发 `internal/status(fiber, oldState)`（L586）；
且**只在 ACTIVE ↔ 非 ACTIVE 边界**对本 fiber provide 的服务做 `reflect.notify`
（L589-594）——服务可用性跟随提供者生命周期。

## 2. Effect 类型族与 effect() 全语义

### 类型（L74-101）

```ts
type Disposable<T> = () => T                    // 清理函数
type Effect<T>    =                             // execute 的四种合法返回:
  | Disposable<T>                               // ① 同步单个 disposer
  | Iterable<Disposable>                        // ② 同步生成器：边 yield 边收集
  | Promise<Disposable>                         // ③ 异步单清理
  | AsyncIterable<Disposable>                   // ④ 异步生成器（带 epoch 检查）
```

### effect(execute, label) 的关键行为（L418-561）

1. `assertActive()`：disposed 后抛 `CordisError('INACTIVE_EFFECT')`
2. **UNLOADING 中直接拒绝新建 effect**（L420）——防止清理期注册逃逸出卸载快照
   （这是 DSH 本地加固，上游允许）
3. **先把自己挂进 `_disposables` 再执行 execute**（L520 注释）：
   重入卸载时能看到"正在启动"的 effect 并等待其完成
4. 收集的每个 disposer 从 fiber 总表**转移**进本 effect 的私有数组
   （collect 里 `this._disposables.delete(dispose)`，L450）——嵌套 effect 形成树
5. 卸载时**逆序**执行；异步清理链式 await（dispose 内部 task 链，L427-442）
6. 返回的 wrapper 同时是 **PromiseLike**：`await disposer` 会等清理完成
   （wrapper.then, L555）；重复调用是 no-op（单次语义 + effectInertia join）
7. 每个公开 disposer 带 `[symbols.effect] = { label, children }` 元数据，
   `fiber.getEffects()`（L568）可打印当前存活 effect 树——内存泄漏诊断工具

### epoch 检查（异步生成器特有）

`_execute` 中 asyncIterator 分支每轮 `iter.next()` 前检查
`runner.epoch !== oldEpoch` 则停止（L391）：插件在 pending 期间被卸载时，
尚未产出的异步清理不再继续收集。

## 3. epoch —— 时间可组合性的核心（L597-639）

```
_checkImpl(name)   把当前可用的依赖实现快照进 _store
_refresh()         epoch = ':' + uid(dep1) + ':' + uid(dep2) + ...
                   缺任一依赖 → INACTIVE
_setEpoch(epoch)   与旧值比较:
                     INACTIVE → 有值: _reload()  (LOADING)
                     有值 → INACTIVE: _unload() (UNLOADING)
                     有值 → 另一个值(提供者换了): 先 _unload 再 _reload
inertia            进行中的转换 promise；存在时 _setEpoch 只改值不重入,
                   转换结束后读最新 epoch 续跑（_reload/_unload 尾部）
```

**为什么 epoch 用提供者的 uid？** 服务被另一个 fiber 替换提供 → uid 序列变 →
epoch 变 → 依赖者自动重启。这就是"替换服务=自动重启"。

`await()`（L704）排空 inertia 后把启动错误 rethrow 给调用方；
`ctx.plugin()` 返回值就是包了 `.then` 的 fiber（registry.ts:331-334）。

## 4. 配置的两段式处理（L50-62, L641-643）

```
_config(raw)  ──激活前──▶ waterfall('internal/config') ──▶ resolveConfig(schema)
```

- `resolveConfig`：runtime.Config 必须实现 standard-schema 的同步 validate；
  issues 聚合成 `ValidationError`（消息含路径），async 校验直接 TypeError
- **懒求值**：raw config 存到 `_config`，直到注入全部激活才解析——
  所以配置可以是引用服务的表达式（DSH loader 的 `!!js` 就靠这个）
- `update(config)`（L736）：ACTIVE 时走 `internal/update` waterfall，
  **监听器不调 next() 即否决更新**；非 ACTIVE 时只更新 raw 待下次激活

## 5. 子 fiber 的生命周期属于父 fiber（L265-297）

```ts
this.dispose = parent.fiber.effect(() => {
  const remove = runtime.fibers.push(this)
  return async () => {
    this.uid = null
    emitPluginDisposed(...)          // internal/plugin，观察者异常全部吞掉
    remove(); if (!fibers.length) registry.delete(runtime)
    this._setEpoch(INACTIVE); ...    // PENDING 也可能已有 effects 要排空
    while (this.inertia) await ...   // 排空进行中的转换
  }
}, 'ctx.plugin()')
```

三层含义：

1. 卸载父级 → 所有子插件自动级联清理（00 章 demo 已验证）
2. 同一 callback 多次 `ctx.plugin()` → 一个 runtime 多个 fibers
   （`Runtime.fibers: DisposableList<Fiber>`，registry.ts:140），
   最后一个移除时 runtime 记录也删除
3. 发布顺序讲究：**先拥有 disposer 再 emit 'internal/plugin'**（L299 注释），
   否则同步观察者立刻 dispose 自己时会漏登记

根 Fiber 特例（L320-332）：`uid=0`、直接 ACTIVE、空 store、`dispose === restart`。

## 示例演示什么

`code/03-fiber.demo.ts`：

1. effect 四种返回形状 + 逆序清理
2. 异步生成器 effect 与中途 dispose
3. `await ctx.plugin()` 拿到启动错误（FAILED 态）
4. Config schema 校验失败的 ValidationError 输出
5. epoch 响应式：provide/unprovide 触发依赖插件自动加载/卸载
6. update 的否决式 waterfall 与 restart
7. getEffects() 泄漏诊断
