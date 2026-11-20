import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { nativeRecording } from './native-recording.mjs'

const [platform, framework] = process.argv.slice(2)
if (
  !['ios', 'android'].includes(platform) ||
  !['plain', 'react', 'angular', 'svelte', 'solid'].includes(framework)
)
  throw new Error('Expected ios|android plain|react|angular|svelte|solid')
const cwd = resolve(process.env.MAVIS_ADAPTER_PROJECT ?? 'examples/native-adapters'),
  output = resolve(
    process.env.MAVIS_ADAPTER_OUTPUT ?? 'artifacts/native-adapters',
    platform,
    framework,
  )
mkdirSync(output, { recursive: true })
const run = (cmd, args) =>
  execFileSync(cmd, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024 }).trim()
execFileSync(
  'ns',
  [
    'build',
    platform,
    ...(platform === 'ios' ? ['--for-device', 'false'] : []),
    `--env.framework=${framework}`,
    '--env.adapterCheck',
    '--no-hmr',
  ],
  { cwd, stdio: 'inherit', timeout: 1200000 },
)
let device,
  booted = false,
  read,
  stopRecording,
  logs = () => {}
const app = process.env.MAVIS_ADAPTER_APP_ID ?? 'com.getcortexlabs.mavis.adapters'
try {
  if (platform === 'ios') {
    const list = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']))
    const selected = Object.entries(list.devices)
      .filter(([runtime]) => runtime.includes('iOS'))
      .flatMap(([, devices]) => devices)
      .find((d) => d.isAvailable && d.name.startsWith('iPhone'))
    if (!selected) throw new Error('No available iPhone simulator')
    device = selected.udid
    const sim = (...args) => run('xcrun', ['simctl', ...args])
    if (selected.state !== 'Booted') {
      sim('boot', device)
      booted = true
    }
    sim('bootstatus', device, '-b')
    const build = resolve(cwd, 'platforms/ios/build/Debug-iphonesimulator')
    const bundle = readdirSync(build).find((name) => name.endsWith('.app'))
    if (!bundle) throw new Error('Missing built iOS application')
    sim('install', device, resolve(build, bundle))
    const file = resolve(
      sim('get_app_container', device, app, 'data'),
      'Documents/adapter-check.json',
    )
    rmSync(file, { force: true })
    read = () => JSON.parse(readFileSync(file, 'utf8'))
    stopRecording = await nativeRecording(platform, device, resolve(output, 'catalog.mp4'))
    // Cold hosted simulators can spend several minutes activating the first app.
    // Keep the event loop free to drain the recorder while CoreSimulator launches it.
    await promisify(execFile)(
      'xcrun',
      ['simctl', 'launch', '--terminate-running-process', device, app],
      {
        timeout: 300000,
        maxBuffer: 16 * 1024 * 1024,
      },
    )
  } else {
    device = run('adb', ['devices'])
      .split('\n')
      .find((line) => /^emulator-\d+\s+device$/.test(line))
      ?.split(/\s/)[0]
    if (!device) throw new Error('No Android emulator')
    const adb = (...args) => run('adb', ['-s', device, ...args])
    adb(
      'install',
      '-r',
      resolve(cwd, 'platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
    )
    adb('shell', 'am', 'force-stop', app)
    adb('logcat', '-c')
    logs = () => writeFileSync(resolve(output, 'device.log'), adb('logcat', '-d', '-t', '3000'))
    adb('shell', 'run-as', app, 'rm', '-f', 'files/adapter-check.json')
    read = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/adapter-check.json'))
    stopRecording = await nativeRecording(platform, device, resolve(output, 'catalog.mp4'))
    adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  }
  let report
  for (let i = 0; i < 90; i++) {
    await delay(1000)
    try {
      report = read()
    } catch {
      continue
    }
    if (report.done) break
  }
  if (report) writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
  if (!report?.done) throw new Error(`${framework} native acceptance did not complete`)
  console.log(JSON.stringify(report, null, 2))
  if (report.failures.length) throw new Error(`${framework}: ${report.failures.join('\n')}`)
} finally {
  try {
    logs()
  } catch (error) {
    // Device logs are diagnostic; a collection failure must not skip video finalization.
    console.warn(`Could not collect native device logs: ${error.message}`)
    writeFileSync(resolve(output, 'log-collection-error.txt'), String(error.stack ?? error))
  } finally {
    try {
      await stopRecording?.()
    } finally {
      if (booted) run('xcrun', ['simctl', 'shutdown', device])
    }
  }
}
