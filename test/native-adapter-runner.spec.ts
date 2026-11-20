import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

// Run the real acceptance runner against an SDK double. No emulator or native app is launched.
async function run(mode: 'success' | 'behavior-failure' | 'missing-video' | 'both-failures') {
  const cwd = await mkdtemp(join(tmpdir(), 'mavis-adapter-cleanup-'))
  temporary.push(cwd)
  const preload = join(cwd, 'sdk.mjs')
  await writeFile(
    preload,
    String.raw`import child from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { writeFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
let recorder
child.execFileSync = (command, args) => {
  if (command === 'ns') return ''
  if (command !== 'adb') throw new Error('Unexpected SDK command: ' + command)
  if (args[0] === 'devices') return 'List of devices attached\nemulator-5554 device\n'
  const action = args.slice(2)
  if (action[0] === 'logcat' && action[1] === '-d') throw new Error('injected logcat failure')
  if (action[0] === 'pull') {
    if (!['missing-video', 'both-failures'].includes(process.env.CLEANUP_MODE)) writeFileSync(action[2], 'video fixture')
    return ''
  }
  if (action.includes('pkill')) queueMicrotask(() => {
    recorder.exitCode = 0
    recorder.emit('close', 0, null)
  })
  if (action.includes('cat')) return JSON.stringify({
    done: true,
    checks: ['native state updated'],
    failures: ['behavior-failure', 'both-failures'].includes(process.env.CLEANUP_MODE) ? ['injected behavior failure'] : [],
  })
  return ''
}
child.spawn = () => {
  recorder = new EventEmitter()
  recorder.exitCode = null
  recorder.kill = () => {}
  recorder.stdout = new PassThrough()
  recorder.stderr = new PassThrough()
  return recorder
}
syncBuiltinESMExports()
`,
  )
  const result = spawnSync(
    process.execPath,
    ['--import', preload, resolve('scripts/check-native-adapters.mjs'), 'android', 'plain'],
    {
      cwd,
      encoding: 'utf8',
      timeout: 15000,
      env: { ...process.env, CLEANUP_MODE: mode, MAVIS_ADAPTER_OUTPUT: join(cwd, 'artifacts') },
    },
  )
  return { result, output: join(cwd, 'artifacts/android/plain') }
}

describe('native acceptance cleanup', () => {
  it('records a log collection failure and still finalizes the required video', async () => {
    const { result, output } = await run('success')
    expect(result.status, result.stderr).toBe(0)
    expect(await readFile(join(output, 'catalog.mp4'), 'utf8')).toBe('video fixture')
    expect(await readFile(join(output, 'log-collection-error.txt'), 'utf8')).toContain(
      'injected logcat failure',
    )
  })
  it('preserves a native behavior failure while finalizing its video', async () => {
    const { result, output } = await run('behavior-failure')
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('injected behavior failure')
    expect(await readFile(join(output, 'catalog.mp4'), 'utf8')).toBe('video fixture')
  })
  it('still rejects a missing recording after log collection fails', async () => {
    const { result } = await run('missing-video')
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('catalog.mp4')
  })
  it('preserves the acceptance failure when recording also fails', async () => {
    const { result, output } = await run('both-failures')
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('injected behavior failure')
    expect(await readFile(join(output, 'recording-error.txt'), 'utf8')).toContain('catalog.mp4')
  })
})
