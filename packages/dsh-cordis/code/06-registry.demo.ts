import { section, step } from './helpers.ts'
import { Context, Service } from '../vendor/cordis/src/index.ts'

section('06 · RegistryService：插件注册表')

const app = new Context()

// ── 1. 三种形态 + name 解析 ────────────────────────────────────────
step('[1] 三种插件形态')
{
  function functionPlugin(_ctx: Context) { console.log('  [function]') }

  class ClassPlugin {
    constructor(_ctx: Context, config: any) {
      console.log('  [class] config =', JSON.stringify(config))
    }
  }

  const objectPlugin = {
    name: 'object-plugin',
    apply(ctx: Context) {
      void ctx
      console.log('  [object]')
    },
  }

  await app.plugin(functionPlugin)
  await app.plugin(ClassPlugin, { role: 'hero' })
  await app.plugin(objectPlugin)

  console.log('  registry.size:', app.registry.size, '| has(object):', app.registry.has(objectPlugin))
}

// ── 2. inject 数组 vs 对象（required / optional）────────────────────
step('[2] inject 声明两种形式')
{
  const log: string[] = []
  const provider = app.inject([], c => c.provide('db', 'mysql'))

  // 数组形式：全必需
  const strict = app.inject(['db'], inner => {
    log.push(`required 激活: db=${inner.db}`)
  })

  // 对象形式：optional 不阻塞激活
  const lenient = app.inject({ optional: ['assets'] }, inner => {
    log.push(`optional 激活，运行时判空: ${inner.assets ?? '(无)'}`)
  })

  await provider
  await strict
  await lenient
  console.log(' ', log.join(' | '))
  await provider.dispose()
}

// ── 3. @Inject 类级装饰器 ─────────────────────────────────────────
step('[3] @Inject 类级')
{
  function Inject(name: string): any {
    return (value: any, decorator: any) => {
      if (decorator.kind === 'class') {
        if (!Object.hasOwn(value, 'inject')) value.inject = Object.create(null)
        value.inject[name] = null
      }
    }
  }

  @Inject('db')
  class NeedsDb {
    constructor(ctx: Context) {
      console.log('  class plugin 等到 db 就绪才构造:', ctx.get('db'))
    }
  }

  const provider = app.inject([], c => c.provide('db', 'pg'))
  const fiber = app.plugin(NeedsDb)
  await provider
  await fiber
  await provider.dispose()
}

// ── 4. awaitable fiber：启动失败 → reject ──────────────────────────
step('[4] await ctx.plugin() 拿到启动错误')
{
  try {
    await app.inject([], () => { throw new Error('bad plugin') })
  } catch (e: any) {
    console.log('  reject:', e.message)
  }
}

// ── 5. registry 遍历与 delete 批量卸载 ─────────────────────────────
step('[5] registry map API 与 delete')
{
  function two() {}
  await app.inject([], c => { void c; })
  await app.plugin(two)

  console.log('  has(two):', app.registry.has(two))
  console.log('  keys:', [...app.registry.keys()].map(f => f.name || '(anon)'))
  console.log('  fibers per runtime:', [...app.registry.values()].map(r => r.fibers.length))

  // delete 接收插件本体（函数），resolve 出 callback 后批量卸载其全部 fibers
  app.registry.delete(two)
  console.log('  delete(two) 后 has(two):', app.registry.has(two))
}

await app.fiber.dispose()
export {}
