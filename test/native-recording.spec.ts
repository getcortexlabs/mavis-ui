import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

async function record(mode: string) {
  const cwd = await mkdtemp(join(tmpdir(), 'mavis-recording-'))
  temporary.push(cwd)
  const preload = join(cwd, 'sdk.mjs')
  const file = join(cwd, 'catalog.mp4')
  await writeFile(
    preload,
    String.raw`import child from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { writeFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
let recorder, flushed = false, pulls = 0
const originalTimeout = globalThis.setTimeout
globalThis.setTimeout = (fn, ms, ...args) => originalTimeout(fn,
  ms === 30000 && process.env.RECORD_MODE === 'hung-recorder' ? 25 : ms, ...args)
child.spawn = () => {
  recorder = new EventEmitter()
  recorder.stdout = new PassThrough()
  recorder.stderr = new PassThrough()
  recorder.exitCode = null
  recorder.kill = () => {
    recorder.exitCode = 130
    recorder.emit('close', 130, 'SIGINT')
  }
  if (process.env.RECORD_MODE === 'encoder-failure') setTimeout(() => {
    recorder.stderr.write('encoder could not start')
    recorder.exitCode = 1
    recorder.emit('close', 1, null)
  }, 10)
  return recorder
}
child.execFileSync = (command, args) => {
  if (command !== 'adb') throw new Error('Unexpected SDK command')
  if (args.includes('pkill')) {
    if (process.env.RECORD_MODE === 'hung-recorder') return ''
    // Finalizing an MP4 can exceed the old fixed 500 ms delay.
    setTimeout(() => {
      if (recorder.exitCode !== null) return
      flushed = true
      recorder.exitCode = 0
      recorder.emit('close', 0, null)
    }, 1500)
    return ''
  }
  if (args.includes('pull')) {
    pulls++
    writeFileSync(process.env.PULL_COUNT, String(pulls))
    if (!flushed) throw new Error('recording was not finalized')
    if (process.env.RECORD_MODE === 'missing-video' ||
        (process.env.RECORD_MODE === 'transient-pull' && pulls === 1)) {
      throw new Error('injected adb transport failure')
    }
    writeFileSync(args.at(-1), 'finalized video fixture')
  }
  return ''
}
syncBuiltinESMExports()
`,
  )
  const entry = join(cwd, 'run.mjs')
  await writeFile(
    entry,
    `import { nativeRecording } from ${JSON.stringify(resolve('scripts/native-recording.mjs'))}
const stop = await nativeRecording('android', 'emulator-5554', ${JSON.stringify(file)})
await new Promise(resolve => setTimeout(resolve, 30))
await stop()
`,
  )
  const result = spawnSync(process.execPath, ['--import', preload, entry], {
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, RECORD_MODE: mode, PULL_COUNT: join(cwd, 'pulls') },
  })
  return { result, file, cwd }
}

describe('Android native recording', () => {
  it('waits for the device recorder to flush before closing adb and copying the video', async () => {
    const { result, file } = await record('delayed-flush')
    expect(result.status, result.stderr).toBe(0)
    expect(await readFile(file, 'utf8')).toBe('finalized video fixture')
  })
  it('retries a transient pull after successful finalization', async () => {
    const { result, cwd } = await record('transient-pull')
    expect(result.status, result.stderr).toBe(0)
    expect(await readFile(join(cwd, 'pulls'), 'utf8')).toBe('2')
  })
  it('still fails when the required video cannot be copied', async () => {
    const { result, cwd } = await record('missing-video')
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('injected adb transport failure')
    expect(await readFile(join(cwd, 'pulls'), 'utf8')).toBe('3')
  })
  it('retains the encoder failure as a recording diagnostic', async () => {
    const { result, file } = await record('encoder-failure')
    expect(result.status).not.toBe(0)
    expect(await readFile(`${file}.log`, 'utf8')).toContain('encoder could not start')
  })
  it('bounds a recorder that never finishes and saves the timeout diagnostic', async () => {
    const { result, file } = await record('hung-recorder')
    expect(result.status).not.toBe(0)
    expect(await readFile(`${file}.log`, 'utf8')).toContain('did not finish writing the video')
  })
})
