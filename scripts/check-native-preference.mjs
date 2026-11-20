import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { nativeRecording } from './native-recording.mjs'
const [platform, device, language = 'en'] = process.argv.slice(2)
if (!['android', 'ios'].includes(platform) || !device)
  throw new Error('Usage: node scripts/check-native-preference.mjs android|ios DEVICE')
const app = 'com.getcortexlabs.mavis.catalog'
const run = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: 'utf8',
    timeout: cmd === 'xcrun' && ['install', 'launch'].includes(args[1]) ? 180000 : 60000,
    maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
if (!['en', 'pt'].includes(language)) throw new Error('Expected en|pt')
const output = resolve('artifacts/preference', platform)
mkdirSync(output, { recursive: true })
let read
let stopRecording
let collectLogs = () => {}
if (platform === 'android') {
  const adb = (...args) => run('adb', ['-s', device, ...args])
  adb(
    'install',
    '-r',
    resolve('examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('shell', 'am', 'force-stop', app)
  adb('logcat', '-c')
  collectLogs = () =>
    writeFileSync(resolve(output, 'device.log'), adb('logcat', '-d', '-t', '3000', '-v', 'brief'))
  adb('shell', 'run-as', app, 'rm', '-f', 'files/preference-check.json')
  stopRecording = await nativeRecording(platform, device, resolve(output, 'preference.mp4'))
  adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  read = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/preference-check.json'))
} else {
  const sim = (...args) => run('xcrun', ['simctl', ...args])
  sim(
    'install',
    device,
    resolve('examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  )
  const file = resolve(
    sim('get_app_container', device, app, 'data'),
    'Documents/preference-check.json',
  )
  rmSync(file, { force: true })
  stopRecording = await nativeRecording(platform, device, resolve(output, 'preference.mp4'))
  sim('launch', '--terminate-running-process', device, app)
  read = () => JSON.parse(readFileSync(file, 'utf8'))
}
let report
for (let attempt = 0; attempt < 90; attempt++) {
  await delay(1000)
  try {
    report = read()
  } catch {
    continue
  }
  if (report.done) break
}
if (report?.done) writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
collectLogs()
await stopRecording()
if (!report?.done) throw new Error('Reduced-motion preference probe did not complete')
console.log(JSON.stringify(report, null, 2))
if (report.failures.length) process.exitCode = 1
