import { section, step } from './helpers.ts'
import { Context } from '../vendor/cordis/src/index.ts'

section('02 · Context：Proxy 容器与派生')

const app = new Context()

// ── 1. 未注入就读服务：Proxy get 陷阱的经典报错 ──────────────────────
step('[1] 无 inject 访问服务的报错样式')
{
  // 根上下文（runtime=null）宽松读取 → undefined（reflect.ts:152）
  console.log('  根上下文读取:', (app as any).database)
  // 插件上下文严格解析 → 抛错（reflect.ts:153-167）
  await app.inject([], inner => {
    try {
      void (inner as any).database
    } catch (e: any) {
      console.log(' ', e.message)
    }
  })
}

// ── 2. extend：O(1) 原型派生 + meta 遮蔽 ───────────────────────────
step('[2] extend 派生子上下文')
{
  const child = app.extend({ requestId: 'req-42' })
  console.log('  child.requestId:', child.requestId, '| parent 上不存在:', ('requestId' in app))
  console.log('  同一 root:', child.root === app.root)
}

// ── 3. isolate：默认隔离 → 同名服务两个世界 ────────────────────────
step('[3] isolate 隔离：同名服务互不可见')
{
  app.provide('cache', 'global-cache')

  // 世界 A：自己的 cache 实现
  const worldA = app.isolate('cache')
  worldA.provide('cache', 'world-A-cache')

  // 世界 B 用另一个 label，提供另一个实现
  const worldB = app.isolate('cache')
  worldB.provide('cache', 'world-B-cache')

  console.log('  全局读到:', app.get('cache'))
  await Promise.all([
    worldA.inject(['cache'], c => console.log('  世界 A 读到:', c.cache)),
    worldB.inject(['cache'], c => console.log('  世界 B 读到:', c.cache)),
  ])
}

// ── 4. isolate 合并：同 label 共享作用域 ───────────────────────────
step('[4] isolate 合并：同 label 的两棵子树共享服务')
{
  const label = Symbol('shared-db')
  const providerSide = app.isolate('db', label)
  const consumerSide = app.isolate('db', label)

  providerSide.provide('db', { query: () => 'row' })

  // provider 与 consumer 分属两棵子树，但 label 相同 → 能互通
  await consumerSide.inject(['db'], async c => {
    console.log('  consumer 拿到 provider 的 db:', c.db.query())
  })
}

// ── 5. intercept：给子树里的服务注入配置 ───────────────────────────
step('[5] intercept 注入服务配置')
{
  const scoped = app.intercept('logger', { name: 'payments' })
  await scoped.inject([], () => {
    // logger 服务会合并 intercept 配置作为默认名字（logger.ts:251-261）
    console.log('  scoped 下日志名:', (scoped.logger as any)().name)
  })
  console.log('  父级不受影响:', (app.logger as any)().name !== 'payments')
}

await app.fiber.dispose()
export {}
