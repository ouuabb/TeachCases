import { section, step } from './helpers.ts'
import { DisposableList, symbols, joinPrototype, createCallable, composeError } from '../vendor/cordis/src/utils.ts'

section('01 · utils.ts 底座机制')

// ── 1. DisposableList：逆序 clear 是"卸载=LIFO 回收"的来源 ──────────
step('[1] DisposableList')
{
  const list = new DisposableList<() => void>()
  const order: string[] = []
  const removeB = list.push(() => order.push('dispose B'))
  list.push(() => order.push('dispose A'))
  list.push(() => order.push('dispose C'))
  console.log('  length:', list.length)

  removeB()
  console.log('  after remove(B):', list.length)

  list.clear().forEach(fn => fn())
  console.log('  clear() 实际执行顺序(逆序):', order)
}

// ── 2. 全局符号表：Symbol.for 跨副本一致 ────────────────────────────
step('[2] symbols 全局唯一')
{
  console.log('  symbols.isolate === Symbol.for("cordis.isolate"):',
    symbols.isolate === Symbol.for('cordis.isolate'))
}

// ── 3. joinPrototype：合并两条原型链，proto1 描述符优先 ─────────────
step('[3] joinPrototype')
{
  const protoA = { greet() { return 'from A' }, tag: 'A' }
  const baseB = { greet() { return 'from B' }, extra: true }
  const protoB = Object.create(baseB)

  const mergedProto = joinPrototype(protoA, protoB)
  const obj = Object.create(mergedProto)
  console.log('  greet 冲突时 A 优先:', obj.greet())
  console.log('  B 链上的属性可达:', obj.extra, '| A 自有属性可达:', obj.tag)
}

// ── 4. createCallable + symbols.invoke：手搓可调用服务 ──────────────
step('[4] createCallable（ctx.logger() 的原理）')
{
  const proto: any = {
    [symbols.invoke](name: string) {
      return `invoked with ${name}`
    },
    describe() { return 'I am a callable service' },
  }

  const callable = createCallable('my-service', proto, { property: 'ctx' }) as any
  callable.ctx = { note: '调用方上下文（真实场景由 Service 构造器注入）' }
  console.log('  typeof:', typeof callable, '| name:', callable.name)
  console.log('  call:', callable('cordis'))
  console.log('  method still reachable:', callable.describe())
}

// ── 5. composeError：异步错误拼回完整调用栈 ────────────────────────
step('[5] composeError 长栈追踪')
{
  async function boom() { throw new Error('boom') }

  try {
    await composeError(async () => { await boom() })
  } catch (e: any) {
    console.log('  拼接后的栈顶 3 帧:')
    for (const frame of e.stack.split('\n').slice(0, 4)) {
      console.log('   ', frame.trim().split(' (')[0])
    }
  }
}

export {}
