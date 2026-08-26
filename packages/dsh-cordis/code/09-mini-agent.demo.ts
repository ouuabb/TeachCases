import { section, step } from './helpers.ts'
import { Context, Service } from '../vendor/cordis/src/index.ts'

section('09 · 综合实战：mini-agent')

// ══════════════ 1. 基础设施服务 ══════════════
class Tools extends Service {
  private map = new Map<string, (args: any) => any>()
  constructor(ctx: Context) {
    super(ctx, 'tools')
  }
  register(name: string, fn: (args: any) => any) {
    this.map.set(name, fn)
    return () => this.map.delete(name)       // 效果：随工具提供者 fiber 回收
  }
  list() { return [...this.map.keys()] }
  call(name: string, args: any) {
    const fn = this.map.get(name)
    if (!fn) throw new Error(`unknown tool: ${name}`)
    return fn(args)
  }
}

class Llm extends Service {
  constructor(ctx: Context) {
    super(ctx, 'llm')
  }
  chat(messages: string[]) {
    return `(llm) 已处理 ${messages.length} 条消息 → 调用工具`
  }
}

const app = new Context()
await app.plugin(Tools)
await app.plugin(Llm)
step('[1] 基础设施就绪')
{
  console.log('  tools:', app.get('tools').list(), '| llm:', !!app.get('llm'))
}

// ══════════════ 2. agent 插件：工具 + waterfall 管道 + schema ══════════════
const agentConfig = {
  name: 'agent',
  inject: ['llm', 'tools'],
  model: 'deepseek-v3',
  Config: {
    '~standard': {
      version: 1,
      vendor: 'demo',
      validate(value: any) {
        if (typeof value?.model !== 'string') {
          return { issues: [{ message: 'model 必须是字符串', path: ['model'] }] }
        }
        return { value }
      },
    },
  },
  apply(ctx: Context, config: { model: string }) {
    // 2a. 注册两个工具：必须经 ctx.effect 托管，重启/卸载才会自动回收
    ctx.effect(() => ctx.tools.register('read-file', ({ path }: any) => `内容(${path})`))
    ctx.effect(() => ctx.tools.register('calc', ({ a, b }: any) => a + b))

    // 2b. 审计层（最外层，只观察并委托）
    ctx.on('agent/tool-call', function (this: any, name: string, args: any, next: any) {
      ctx.logger.info('[audit] 调用 %s %o', name, args)
      return next()
    })

    // 2c. 执行层
    ctx.on('agent/tool-call', function (this: any, name: string, args: any, next: any) {
      return ctx.tools.call(name, args)
    })

    // 2d. 权限否决层（prepend 抢最外层；不调 next() = 短路）
    ctx.on('agent/tool-call', function (this: any, name: string, _args: any, next: any) {
      if (name === 'rm') {
        ctx.logger.warn('[policy] 拒绝危险工具 %s', name)
        return undefined          // 不调 next() = 否决，链在此中断
      }
      return next()
    }, true)

    ctx.logger.info('[agent] 启动，model=%s', config.model)
  },
}

let agentFiber: any
agentFiber = app.plugin(agentConfig as any, { model: 'deepseek-v3' })
await agentFiber

step('[2] 工具调用管道')
{
  const call = (name: string, args: any) =>
    app.waterfall('agent/tool-call' as any, name, args, () => 'builtin-fallback')

  console.log('  工具列表:', app.get('tools').list())
  console.log('  calc(1,2)  →', call('calc', { a: 1, b: 2 }))
  console.log('  read-file  →', call('read-file', { path: '/tmp/x' }))
  console.log('  rm         →', call('rm', { path: '/' }), '(被权限层否决)')
}

// ══════════════ 3. 热更新：换 model → 插件重启 → 工具重注册 ══════════════
step('[3] update() 热更新与副作用重放')
{
  const before = app.get('tools').list()
  await agentFiber.update({ model: 'deepseek-r1' })
  const after = app.get('tools').list()
  console.log('  更新前后工具集合:', before.join('+'), '→', after.join('+'), '| 一致:', JSON.stringify(before) === JSON.stringify(after))
}

// ══════════════ 4. 非法配置被拒 ══════════════
step('[4] ValidationError')
{
  let bad: any
  try {
    bad = app.plugin(agentConfig as any, { model: 42 })
    await bad
  } catch (e: any) {
    console.log(' ', e.message.replace(/\n/g, ' | '))
    await bad.dispose()              // 失败的 fiber 也要回收，否则残留 runtime
  }
}

// ══════════════ 5. 优雅停机：零残留 ══════════════
step('[5] 优雅停机')
{
  console.log('  停机前工具列表:', app.get('tools').list())
  await (agentFiber as any).dispose()
  console.log('  停机后工具列表:', app.get('tools').list(), '| registry size:', app.registry.size)
}

await app.fiber.dispose()
console.log('\nmini-agent demo passed ✓')
export {}