import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const [platform, device] = process.argv.slice(2)
if (!['android', 'ios'].includes(platform) || !device)
  throw new Error('Usage: node scripts/check-native-screen-components.mjs android|ios DEVICE')
const app = 'com.getcortexlabs.mavis.catalog'
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', timeout: 60000 }).trim()
const output = resolve('artifacts/screen-components', platform)
mkdirSync(output, { recursive: true })
let read
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
    writeFileSync(resolve(output, 'device.log'), adb('logcat', '-d', '-v', 'brief'))
  adb('shell', 'run-as', app, 'rm', '-f', 'files/screen-components-check.json')
  adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  read = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/screen-components-check.json'))
} else {
  const sim = (...args) => run('xcrun', ['simctl', ...args])
  sim(
    'install',
    device,
    resolve('examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  )
  const file = resolve(
    sim('get_app_container', device, app, 'data'),
    'Documents/screen-components-check.json',
  )
  rmSync(file, { force: true })
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
collectLogs()
if (!report?.done) throw new Error('Screen components probe did not complete')
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.failures.length) process.exitCode = 1
