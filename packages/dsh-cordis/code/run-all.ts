const modules = [
  './00-bootstrap.demo.ts',
  './01-utils.demo.ts',
  './02-context.demo.ts',
  './03-fiber.demo.ts',
  './04-events.demo.ts',
  './05-reflect.demo.ts',
  './06-registry.demo.ts',
  './07-service.demo.ts',
  './08-logger.demo.ts',
  './09-mini-agent.demo.ts',
]

for (const mod of modules) {
  try {
    await import(mod)
  } catch (error) {
    console.error(`FAILED at ${mod}:`, error)
    process.exitCode = 1
    break
  }
}
