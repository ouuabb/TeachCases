let depth = 0

export function section(title: string) {
  const line = '='.repeat(58)
  console.log(`\n${line}\n${title}\n${line}`)
}

export function step(msg: string) {
  console.log(`  ${msg}`)
}

export async function maybe(condition: boolean, fn: () => Promise<void>) {
  if (condition) await fn()
}
