import { section, step } from './helpers.ts'
import { Context } from '../vendor/cordis/src/index.ts'

section('05 · ReflectService：服务反射层')

const app = new Context()

// ── 1. 报错样式三连 ────────────────────────────────────────────────
step('[1] 三类 DI 报错')
{
  // a) 无 inject 读服务（插件上下文才抛；根上下文宽松返回 undefined）
  await app.inject([], inner => {
    try {
      void (inner as any).database
    } catch (e: any) {
      console.log('  a) no inject:', e.message)
    }

    // b) 跨 fiber set：服务归属权
    try {
      ;(inner as any).logger = 'hack'
    } catch (e: any) {
      console.log('  b) cross-fiber set:', e.message)
    }
  })

  // c) 同 scope 重复 provide
  try {
    app.provide('dup', 'first')
    app.provide('dup', 'second')
  } catch (e: any) {
    console.log('  c) duplicate provide:', e.message)
  }
}

// ── 2. provide 生命周期：卸载即消失，依赖者自动回到 PENDING ────────
step('[2] provide = 提供者 fiber 的生命周期')
{
  const { FiberState } = await import('../vendor/cordis/src/fiber.ts')
  const log: string[] = []
  const consumer: any = app.inject(['greeting'], inner => {
    log.push(`consumer loaded: ${inner.greeting}`)
  })

  const provider: any = app.inject([], p => p.provide('greeting', 'hi'))
  await provider
  await consumer
  console.log('  提供后:', log.at(-1))

  await provider.dispose()
  console.log('  提供者卸载后 consumer state:', FiberState[consumer.state], '(0=PENDING)')
}

// ── 3. notify：替换提供者 → 依赖者自动重启 ─────────────────────────
step('[3] 替换提供者 = 自动重启')
{
  const log: string[] = []
  const consumer: any = app.inject(['kv'], inner => {
    log.push(`kv = ${inner.kv}`)
  })

  const p1: any = app.inject([], c => c.provide('kv', 'v1'))
  await p1; await consumer
  console.log('  provider#1:', log.at(-1))

  await p1.dispose()                        // 依赖者卸载
  const p2: any = app.inject([], c => c.provide('kv', 'v2'))
  await p2
  await new Promise(r => setTimeout(r, 30))
  console.log('  provider#2 接棒:', log.at(-1))
  await p2.dispose()
}

// ── 4. accessor：计算属性 ──────────────────────────────────────────
step('[4] ctx.accessor() 计算属性')
{
  let count = 0
  await app.inject([], inner => {
    inner.accessor('requests', {
      get: () => `requests=${count}`,
      set: (v: number) => { count = v; return true },
    })
    count = 42
    console.log('  读取 accessor:', (inner as any).requests)
    ;(inner as any).requests = 7
    console.log('  写入后:', (inner as any).requests)
  })
}

// ── 5. mixin：把服务成员转发到 ctx ────────────────────────────────
step('[5] ctx.mixin() 自定义转发')
{
  // mixin 的 source 是 ctx 属性名（reflect.ts:368-371: getTarget = ctx => ctx[source]）
  const svc = {
    version: '1.0',
    ping() { return 'pong' },
  }
  await app.inject([], inner => {
    inner.provide('mysvc', svc)
    inner.mixin('mysvc', ['version', 'ping'])
    console.log('  ctx.version:', (inner as any).version, '| ctx.ping():', (inner as any).ping())
  })
}

// ── 6. get(strict) 与 trace/bind ───────────────────────────────────
step('[6] get / trace / bind')
{
  app.provide('pkg', { id: 1 })
  console.log('  app.get("pkg"):', app.get('pkg'))

  const traced = app.reflect.trace({ kind: 'traced' })
  console.log('  trace 后仍是对象:', typeof traced === 'object')
}

await app.fiber.dispose()
export {}
