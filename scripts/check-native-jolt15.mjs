import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const [platform, device] = process.argv.slice(2)
if (!['android', 'ios'].includes(platform) || !device)
  throw new Error('Usage: node scripts/check-native-jolt15.mjs android|ios DEVICE')
// Install a catalog built with --env.jolt15Check. Devices are managed by the caller.
const app = 'com.getcortexlabs.mavis.catalog'
const filename = 'jolt15-check.json'
const run = (command, args, timeout = 60000) =>
  execFileSync(command, args, { encoding: 'utf8', timeout }).trim()
const output = resolve('artifacts/jolt15', platform)
mkdirSync(output, { recursive: true })
rmSync(resolve(output, 'report.json'), { force: true })
let read
if (platform === 'android') {
  const adb = (...args) => run('adb', ['-s', device, ...args])
  adb(
    'install',
    '-r',
    resolve('examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('shell', 'am', 'force-stop', app)
  adb('shell', 'run-as', app, 'rm', '-f', `files/${filename}`)
  adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  read = () => JSON.parse(adb('shell', 'run-as', app, 'cat', `files/${filename}`))
} else {
  const sim = (...args) => run('xcrun', ['simctl', ...args])
  // A newly booted hosted simulator can spend more than a minute installing the runtime.
  run(
    'xcrun',
    [
      'simctl',
      'install',
      device,
      resolve('examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
    ],
    300000,
  )
  const file = resolve(sim('get_app_container', device, app, 'data'), 'Documents', filename)
  rmSync(file, { force: true })
  // First launch on a cold hosted simulator can take longer than ordinary simctl calls.
  run('xcrun', ['simctl', 'launch', '--terminate-running-process', device, app], 300000)
  read = () => JSON.parse(readFileSync(file, 'utf8'))
}
let report, lastCase
for (let attempt = 0; attempt < 210; attempt++) {
  await delay(1000)
  try {
    report = read()
  } catch {
    continue
  }
  // Preserve partial evidence even if the app crashes or a native call blocks the JS thread.
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
  if (report.active !== lastCase) {
    lastCase = report.active
    console.log(`${platform}: ${lastCase}`)
  }
  if (report.done) break
}
if (!report?.done)
  throw new Error(
    `Jolt native probe did not complete; last case: ${report?.active ?? 'startup'}. Partial report: ${output}/report.json`,
  )
console.log(JSON.stringify(report, null, 2))
if (!Array.isArray(report.failures) || report.failures.length) process.exitCode = 1
