import { section, step } from './helpers.ts'
import { Context } from '../vendor/cordis/src/index.ts'

section('03 · Fiber：状态机 / effect / epoch')

const app = new Context()

// ── 1. effect 四种形状 + 逆序清理 ──────────────────────────────────
step('[1] effect 四种返回形状')
{
  const order: string[] = []
  const plugin = await app.inject([], inner => {
    inner.effect(() => () => order.push('① sync'), 'sync')
    inner.effect(function* () {
      yield () => order.push('② gen-1')
      yield () => order.push('② gen-2')
    }, 'generator')
    inner.effect(async () => () => order.push('③ async'), 'async')
    return () => order.push('④ 插件体返回值也是 disposer')
  })
  console.log('  已注册，开始卸载...')
  await (plugin as any).dispose()
  console.log('  卸载执行顺序(逆序):', order.join(' -> '))
}

// ── 2. 异步生成器 effect：分批产出、异步链式回收 ────────────────────
step('[2] async generator effect')
{
  const collected: string[] = []
  let disposer!: () => Promise<void>
  const plugin = app.inject([], inner => {
    disposer = inner.effect(async function* () {
      yield () => collected.push('disposer-1')
      await new Promise(r => setTimeout(r, 10))
      yield () => collected.push('disposer-2')
    }, 'async-gen')
  })
  await plugin
  console.log('  激活完成，开始卸载（等待异步清理链排空）...')
  await disposer()
  console.log('  异步生成器产出的清理逆序执行:', collected.join(' -> '))
}

// ── 3. 启动错误经 await 抛出（FAILED 态）────────────────────────────
step('[3] await ctx.plugin() 捕获启动错误')
{
  try {
    await app.inject([], () => { throw new Error('startup exploded') })
  } catch (e: any) {
    console.log(' ', e.message)
  }
}

// ── 4. Config schema 校验（standard-schema）────────────────────────
step('[4] ValidationError')
{
  const badPlugin: any = {
    name: 'needs-number',
    Config: {
      '~standard': {
        version: 1,
        vendor: 'demo',
        validate(value: any) {
          if (typeof value?.port !== 'number') {
            return { issues: [{ message: 'expect number', path: ['port'] }] }
          }
          return { value }
        },
      },
    },
    apply() {},
  }
  try {
    await app.plugin(badPlugin, { port: 'not-a-number' })
  } catch (e: any) {
    console.log(' ', e.name, ':', e.message.replace(/\n/g, ' | '))
  }
}

// ── 5. epoch 响应式：服务出现/替换/收回驱动加载/卸载 ─────────────────
step('[5] 服务变更 = 自动重启')
{
  const { FiberState } = await import('../vendor/cordis/src/fiber.ts')
  const log: string[] = []

  const consumer: any = app.inject(['db'], inner => {
    log.push(`loaded with db=${inner.db}`)
  })
  console.log('  提供 db 前 state:', FiberState[consumer.state], '(0=PENDING)')

  // 提供者一号：独立插件，'db' 服务归它的 fiber 所有
  const provider1: any = app.inject([], p => p.provide('db', 'sqlite-v1'))
  await provider1
  await consumer
  console.log('  provider#1 就位 →', log.at(-1))

  // 卸载提供者一号 → 消费者失去依赖 → 自动卸载（回到 PENDING）
  await provider1.dispose()
  console.log('  收回 provider#1 → state:', FiberState[consumer.state])

  // 提供者二号接棒：不同 fiber、不同 uid → epoch 变化 → 消费者自动重载
  const provider2: any = app.inject([], p => p.provide('db', 'pg-v2'))
  await provider2
  await new Promise(r => setTimeout(r, 30))
  console.log('  provider#2 接棒 →', log.at(-1))
}

// ── 6. update：否决式 waterfall ────────────────────────────────────
step('[6] update 可被监听器否决')
{
  // internal/update 监听器必须在"插件自己的 ctx"上注册：
  // events.ts:140 的 internal/listener 钩子会把它存进该 fiber 专属的分发表
  let pluginCtx: any
  const plugin: any = await app.plugin({
    name: 'cfgd',
    apply(inner: Context, config: any) {
      pluginCtx = inner
      console.log('  running with config =', JSON.stringify(config))
    },
  }, { v: 1 })

  await plugin.update({ v: 2 })

  pluginCtx.on('internal/update' as any, (config: any, _noSave: any, next: any) => {
    if (config.v === 3) {
      console.log('  [veto] v=3 被否决，不调用 next()')
      return
    }
    // 注意必须 return next()：否则调用方 await update() 拿不到重启完成信号
    return next()
  })

  await plugin.update({ v: 3 })
  await plugin.update({ v: 4 })
}

// ── 7. getEffects 泄漏诊断 ─────────────────────────────────────────
step('[7] getEffects() 诊断树')
{
  const fiber: any = await app.inject([], inner => {
    inner.effect(() => () => {}, 'outer-effect')
    inner.on('internal/dispatch', () => {})
  })
  for (const meta of fiber.getEffects()) {
    console.log(`  - ${meta.label} (children: ${meta.children.length})`)
  }
}

await app.fiber.dispose()
export {}
