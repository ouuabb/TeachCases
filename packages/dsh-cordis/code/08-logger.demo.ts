import { section, step } from './helpers.ts'
import { Context } from '../vendor/cordis/src/index.ts'

section('08 · LoggerService：日志门面')

const app = new Context()

// 全放行阈值：level <= threshold 才到达，DEBUG=3，故给 10
function allLevels() {
  return { default: 10 }
}

// ── 1. 自定义 exporter 抓 Message ──────────────────────────────────
step('[1] exporter 收到结构化 Message')
{
  const seen: string[] = []
  await app.inject([], inner => {
    inner.logger.exporter({
      levels: allLevels(),
      export(message: any) {
        seen.push(`#${message.sn} [${message.type}] ${message.name}: ${JSON.stringify(message.args)}`)
      },
    })
  })

  const log = app.logger('app')
  log.info('hello %s', 'world')
  log.warn('value = %d', 3.7)
  console.log(' ', seen.join('\n  '))
}

// ── 2. 级别过滤：level > threshold 的条目被跳过 ────────────────────
step('[2] levels 阈值（threshold=2 → DEBUG 被吞）')
{
  const got: string[] = []
  await app.inject([], inner => {
    inner.logger.exporter({
      levels: { filtered: 2 },
      export(m: any) { got.push(`${m.type}(${m.level})`) },
    })
  })
  const log = app.logger('filtered')
  log.debug('debug(3) 被吞')
  log.info('info(1) 到达')
  log.warn('warn(2) 到达')
  console.log('  实际到达:', got.join(', '))
}

// ── 3. Error 参数展开（Message.args 是原始参数，未格式化）───────────
step('[3] Error / AggregateError 展开')
{
  const got: string[] = []
  await app.inject([], inner => {
    inner.logger.exporter({
      levels: allLevels(),
      export(m: any) {
        const first = m.args[0]
        got.push(first instanceof Error ? first.message : String(first))
      },
    })
  })
  const log = app.logger('errs')
  log.error(new Error('boom'))
  log.error(new AggregateError([new Error('e1'), new Error('e2')], 'agg'))
  console.log(' ', got.join(' | '))
}

// ── 4. 缺省名来自插件名 ────────────────────────────────────────────
step('[4] 缺省名 vs 显式名')
{
  const got: string[] = []
  await app.inject([], inner => {
    inner.logger.exporter({
      levels: allLevels(),
      export(m: any) { got.push(m.name) },
    })
    // 插件内 logger 缺省名 = hyphenate(fiber.name)（此处无名插件继承 root）
    inner.logger.info('default name')
  })
  app.logger('explicit-name').info('explicit')
  console.log('  名字:', [...new Set(got)].join(', '))
}

// ── 5. exporter 随 fiber 卸载自动移除 ─────────────────────────────
step('[5] exporter 生命周期')
{
  const got: string[] = []
  const holder = await app.inject([], inner => {
    inner.logger.exporter({
      levels: allLevels(),
      export(m: any) { got.push(m.type) },
    })
  })
  app.logger('life').info('在')
  await (holder as any).dispose()
  app.logger('life').info('不再到达')
  console.log('  收到:', got.join(','))
}

// ── 6. intercept 改变子树缺省日志名 ───────────────────────────────
step('[6] intercept("logger") 注入缺省名')
{
  const got: string[] = []
  await app.inject([], inner => {
    inner.logger.exporter({
      levels: allLevels(),
      export(m: any) { got.push(m.name) },
    })
  })

  const scoped = app.intercept('logger', { name: 'payments' })
  await scoped.inject([], inner => inner.logger.info('scoped 命名'))
  await app.inject([], inner => inner.logger.info('外层命名'))
  console.log(' ', got.join(' | '))
}

await app.fiber.dispose()
export {}