import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error Native ESM orchestration helper.
import { runNativeCommand } from '../scripts/portable-native-runner.mjs'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const run = async (script: string, options: Record<string, unknown> = {}) => {
  const cwd = await mkdtemp(join(tmpdir(), 'mavis-native-runner-'))
  temporary.push(cwd)
  const logPath = join(cwd, 'xcodebuild.log')
  return {
    logPath,
    result: runNativeCommand(process.execPath, ['-e', script], {
      cwd,
      logPath,
      timeoutMs: 2000,
      graceMs: 100,
      output: null,
      ...options,
    }),
  }
}
describe('bounded native CI process', () => {
  it('keeps complete successful output without mistaking a warning for a failed test', async () => {
    const { result, logPath } = await run(
      'console.log("compiled"); console.error("warning: failed optional lookup");',
    )
    await expect(result).resolves.toEqual({ code: 0 })
    expect(await readFile(logPath, 'utf8')).toContain('failed optional lookup')
  })
  it('stops after a chunked test failure and allows the result bundle to flush', async () => {
    const { result, logPath } = await run(`
      process.on('SIGINT', () => { console.log('flushed result'); process.exit(0) })
      process.stdout.write("Test Case '-[Suite testCalendar]' ")
      setTimeout(() => console.log('failed (12.0 seconds).'), 20)
      setInterval(() => {}, 1000)
    `)
    await expect(result).rejects.toThrow(/first failed test.*testCalendar/)
    expect(await readFile(logPath, 'utf8')).toContain('flushed result')
  })
  it('rejects compiler failures even when no test-case line was printed', async () => {
    const { result } = await run('console.error("error: function is unused"); process.exit(65)')
    await expect(result).rejects.toThrow(/65/)
  })
  it('bounds an unresponsive command without reporting a timeout as success', async () => {
    const { result } = await run(
      'process.on("SIGINT", () => {}); process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)',
      { timeoutMs: 300, graceMs: 50 },
    )
    await expect(result).rejects.toThrow(/exceeded 300 ms/)
  })
})
