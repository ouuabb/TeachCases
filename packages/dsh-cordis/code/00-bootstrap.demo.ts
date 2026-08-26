import { section } from './helpers.ts'
import { Context } from '../vendor/cordis/src/index.ts'

section('00 · 根上下文引导（对照 docs/00-overview.md）')

// 1. new Context() 返回的是 Proxy（context.ts:74,83）
const ctx = new Context()
console.log('Context.is(ctx):', Context.is(ctx))
console.log('root fiber name:', ctx.fiber.name)

// 2. 根 Fiber 特例：runtime=null、uid=0、直接 ACTIVE（fiber.ts:320-332）
console.log('root uid:', ctx.fiber.uid, '| state(ACTIVE=2):', ctx.fiber.state)

// 3. 四大服务就位（context.ts:78-81）
console.log('services installed:', {
  reflect: !!ctx.reflect,
  registry: !!ctx.registry,
  events: !!ctx.events,
  logger: !!ctx.logger,
})

// 4. 观察生命周期事件：internal/status（events.ts:333）
let statusChanges = 0
ctx.on('internal/status', (fiber, oldValue) => {
  statusChanges++
  console.log(`[status] fiber#${fiber.uid}: ${oldValue} -> ${fiber.state}`)
})

await ctx.inject([], () => {
  console.log('[plugin] a trivial plugin body ran')
})
console.log('status transitions captured:', statusChanges > 0)

// 5. 插件 fiber 由父 fiber 的 effect 托管（fiber.ts:265-297）：
//    卸载父级 → 子插件一并被清理，无需手工注销
const scope = ctx.extend()
const child = await scope.inject([], () => console.log('[child] loaded'))
console.log('child uid while loaded:', child.uid)
await scope.fiber.dispose()
console.log('child uid after parent disposed:', child.uid, '(null = 已回收)')

export {}
