import { section, step } from './helpers.ts'
import { Context, Service } from '../vendor/cordis/src/index.ts'

section('07 · Service 抽象基类')

const app = new Context()

// ── 1. 自定义服务：继承 Service，构造即注册 ────────────────────────
step('[1] 继承 Service 定义服务')
{
  class Greeter extends Service {
    constructor(ctx: Context) {
      super(ctx, 'greeter')                    // service.ts:57 -> ctx.reflect.provide
    }
    hello(name: string) { return `hello, ${name}` }
  }

  // Service 本身也是插件（class 插件）：ctx.plugin(Greeter)
  const fiber = app.plugin(Greeter)
  await fiber

  await app.inject(['greeter'], inner => {
    console.log('  inject 消费:', inner.greeter.hello('cordis'))
    console.log('  instanceof Service:', inner.greeter instanceof Service)
  })

  // 卸载提供者 → 服务消失 → 依赖者不再激活（此处无输出 = 保持 PENDING）
  await fiber.dispose()
  console.log('  服务被收回，consumer 不再激活（保持 PENDING）')
}

// ── 2. check 谓词：控制服务可用性 ──────────────────────────────────
step('[2] check 谓词')
{
  const { FiberState } = await import('../vendor/cordis/src/fiber.ts')
  let ready = false
  const consumer: any = app.inject(['feature'], inner => {
    console.log('  consumer 激活:', inner.feature)
  })

  const provider: any = app.inject([], c => c.provide('feature', 'F', () => ready))
  await provider
  await new Promise(r => setTimeout(r, 20))
  console.log('  check=false 时 state:', FiberState[consumer.state], '(0=PENDING)')

  ready = true
  app.reflect.notify(['feature'])               // 主动广播可用性变化
  await consumer
  console.log('  check=true + notify 后激活')
  await provider.dispose()
}

// ── 3. callable service：实现 [symbols.invoke] ─────────────────────
step('[3] callable service')
{
  const { Service: S } = await import('../vendor/cordis/src/index.ts')

  class Router extends S {
    constructor(ctx: Context) {
      super(ctx, 'router')
    }
  }
  // 定义 invoke 体：ctx.router() 可被直接调用
  ;(Router.prototype as any)[(S as any).invoke] = function (path: string) {
    return `route(${path})`
  }

  const fiber = app.plugin(Router)
  await fiber
  await app.inject(['router'], inner => {
    console.log('  ctx.router("/api"):', (inner as any).router('/api'))
  })
  await fiber.dispose()
}

// ── 4. intercept 配置合并 ──────────────────────────────────────────
step('[4] intercept 合并')
{
  class Settings extends Service {
    constructor(ctx: Context) {
      super(ctx, 'settings')
    }
    getConfig() {
      // 手工调用 resolveConfig：base 垫底、祖先 intercept 其次、head 置顶
      return this[(Service as any).resolveConfig]({ base: 'B' }, { head: 'H' })
    }
  }

  const fiber = app.plugin(Settings)
  await fiber

  const scoped = app.intercept('settings', { region: 'cn' })
  await scoped.inject(['settings'], inner => {
    const cfg = (inner.settings as any).getConfig()
    console.log('  合并结果:', JSON.stringify(cfg), '(base/head + intercept 按序)')
  })
  await fiber.dispose()
}

await app.fiber.dispose()
export {}
