import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

// Exercise the real orchestrator without launching an SDK or native application.
async function run(platform: 'android' | 'ios', failure: boolean) {
  const cwd = await mkdtemp(join(tmpdir(), 'mavis-jolt-cleanup-'))
  temporary.push(cwd)
  const catalog = join(cwd, 'examples/catalog')
  const installed = join(catalog, 'node_modules/@rafaelaugusto/jolt')
  await mkdir(installed, { recursive: true })
  await writeFile(
    join(catalog, 'package.json'),
    JSON.stringify({
      dependencies: { '@rafaelaugusto/jolt': '0.1.0-rc.18' },
      devDependencies: { '@nativescript/android': '9.1.1', '@nativescript/ios': '9.1.0' },
    }),
  )
  await writeFile(join(installed, 'package.json'), JSON.stringify({ version: '0.1.0-rc.18' }))
  const preload = join(cwd, 'sdk.mjs')
  await writeFile(
    preload,
    String.raw`import child from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { appendFileSync } from 'node:fs'
child.execFileSync = (command, args) => {
  appendFileSync('sdk-calls.jsonl', JSON.stringify({ command, args }) + '\n')
  if (command === process.execPath) {
    if (process.env.PROBE_FAILURE === '1') throw new Error('injected native probe failure')
    return ''
  }
  if (command === 'adb') {
    if (args[0] === 'devices') return 'List of devices attached\nemulator-5554 device\n'
    if (args.includes('getprop')) return '15'
    if (args.includes('logcat')) throw new Error('injected diagnostic failure')
  }
  if (command === 'xcrun') {
    if (args.includes('list')) return JSON.stringify({ devices: { 'iOS-26': [
      { isAvailable: true, name: 'iPhone Test', udid: 'test-phone', state: 'Shutdown' }
    ] } })
    if (args.includes('screenshot')) throw new Error('injected diagnostic failure')
    if (args.includes('boot') || args.includes('bootstatus') || args.includes('shutdown')) return ''
  }
  throw new Error('Unexpected SDK command: ' + command + ' ' + args.join(' '))
}
syncBuiltinESMExports()
`,
  )
  const result = spawnSync(
    process.execPath,
    ['--import', preload, resolve('scripts/check-native-jolt-ci.mjs'), platform],
    {
      cwd,
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, PROBE_FAILURE: failure ? '1' : '0' },
    },
  )
  return { cwd, result, output: join(cwd, 'artifacts/jolt15', platform) }
}

describe.each(['android', 'ios'] as const)('native Jolt %s cleanup', (platform) => {
  it.each([false, true])(
    'preserves the probe result (failure=%s) when diagnostics fail',
    async (failure) => {
      const { cwd, result, output } = await run(platform, failure)
      expect(result.status, result.stderr).toBe(failure ? 1 : 0)
      if (failure) expect(result.stderr).toContain('injected native probe failure')
      expect(await readFile(join(output, 'diagnostic-collection-error.txt'), 'utf8')).toContain(
        'injected diagnostic failure',
      )
      const calls = (await readFile(join(cwd, 'sdk-calls.jsonl'), 'utf8'))
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
      if (platform === 'ios')
        expect(calls.at(-1)).toEqual({
          command: 'xcrun',
          args: ['simctl', 'shutdown', 'test-phone'],
        })
    },
  )
})
