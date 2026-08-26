import { section, step } from './helpers.ts'
import { Context } from '../vendor/cordis/src/index.ts'

section('04 · EventsService：五种分发模式')

const app = new Context()

// 统一的三个监听器，观察不同模式下的执行差异
function setup(ctx: Context) {
  const calls: string[] = []
  ctx.on('demo', (v: string) => { calls.push(`A(${v})`) })
  ctx.on('demo', async (v: string) => { calls.push(`B(${v})`); return 'from-B' })
  ctx.on('demo', (v: string) => { calls.push(`C(${v})`); return 'from-C' }, true /* prepend */)
  return calls
}

step('[1] emit：同步全跑，忽略返回值')
{
  const calls = setup(app)
  app.emit('demo' as any, 'x')
  console.log('  执行序:', calls.join(' '), '(C 因 prepend 排最前)')
}

step('[2] parallel：并发等待，错误聚合成 AggregateError')
{
  const ctx2 = new Context()
  const done: string[] = []
  ctx2.on('p', async () => { await sleep(20); done.push('slow') })
  ctx2.on('p', () => { done.push('fast') })
  ctx2.on('p', () => { throw new Error('listener failed') })
  try {
    await (ctx2 as any).parallel('p')
  } catch (e: any) {
    console.log('  done:', done.join(','), '| errors:', e.errors?.map((x: Error) => x.message))
  }
  await ctx2.fiber.dispose()
}

step('[3] serial：逐个 await，遇 bail 即停')
{
  const calls = setup(app)
  const result = await (app as any).serial('demo', 'y')
  console.log('  执行序:', calls.join(' '))
  console.log('  返回首个 bail 值:', result)
}

step('[4] bail 判定边界：null/false/undefined 不算')
{
  const ctx3 = new Context()
  void ctx3.on('edge', () => null)
  void ctx3.on('edge', () => false)
  void ctx3.on('edge', () => undefined)
  void ctx3.on('edge', () => 'third-wins')
  const r = (ctx3 as any).bail('edge')
  console.log('  前三个都被放行，最终:', r)
  await ctx3.fiber.dispose()
}

step('[5] waterfall：洋葱模型与短路否决')
{
  const ctx4 = new Context()
  const trace: string[] = []

  void ctx4.on('wf', function (this: any, value: string, next: () => any) {
    trace.push(`outer 看到 ${value}`)
    return next()
  })

  void ctx4.on('wf', function (this: any, value: string, _next: () => any) {
    trace.push(`inner 拥有决策权，短路！`)
    return `${value}!`.toUpperCase()
  })

  const builtIn = (v: string) => `builtin(${v})`
  const final = (ctx4 as any).waterfall('wf', 'ping', builtIn)
  console.log(' ', trace.join(' | '))
  console.log('  最终结果:', final, '(内建行为被跳过)')
  await ctx4.fiber.dispose()
}

step('[6] global：无视上下文过滤的全局监听器')
{
  const scoped = app.extend()
  const seen: string[] = []
  // 带 filter 的派生上下文：只投递给"注册 ctx 属于该作用域"的监听器
  ;(scoped as any)[Symbol.for('cordis.filter')] = (target: Context) => target === scoped || true
  void scoped.on('scoped-event', () => seen.push('normal-listener'))
  void app.on('scoped-event', () => seen.push('global-listener'), { global: true })

  app.emit('scoped-event' as any)
  console.log('  收到的监听器:', seen.join(', '), '| global 总能收到')
}

step('[7] once：首次触发自清理')
{
  const ctx5 = new Context()
  let n = 0
  void ctx5.once('tick', () => n++)
  ctx5.emit('tick' as any)
  ctx5.emit('tick' as any)
  console.log('  触发两次，实际执行:', n, '次')
  await ctx5.fiber.dispose()
}

step('[8] internal/dispatch：旁路观察总线')
{
  const observed: string[] = []
  const stop = app.on('internal/dispatch' as any, (mode: string, name: string) => {
    if (!name.startsWith('internal/')) observed.push(`${name}@${mode}`)
  })
  app.emit('evt-a' as any)
  void (app as any).serial('evt-b')
  stop()
  console.log('  旁路记录:', observed.join(', '))
}

await app.fiber.dispose()

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export {}
