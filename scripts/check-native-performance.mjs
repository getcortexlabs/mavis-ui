import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { validateReport } from '../test/performance/report.ts'
import { platform as hostPlatform, arch, cpus } from 'node:os'

const [platform, device, name = `${platform}-phone`] = process.argv.slice(2)
if (!['android', 'ios', 'ios-device'].includes(platform) || !device || !/^[\w-]+$/.test(name)) {
  throw new Error(
    'Usage: node scripts/check-native-performance.mjs android|ios|ios-device DEVICE [run-name]',
  )
}
const root = resolve(import.meta.dirname, '..')
const app = 'com.getcortexlabs.mavis.catalog'
const output = resolve(root, 'artifacts/performance', name)
mkdirSync(output, { recursive: true })
const run = (command, args) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
  }).trim()
const adb = (...args) => run('adb', ['-s', device, ...args])
const simctl = (...args) => run('xcrun', ['simctl', ...args])
const metadata = {}
if (platform !== 'ios-device')
  metadata.host = { platform: hostPlatform(), arch: arch(), cpu: cpus()[0]?.model }
let readReport
let stopApp = () => {}
if (platform === 'android') {
  metadata.fontScale = adb('shell', 'settings', 'get', 'system', 'font_scale')
  adb(
    'install',
    '-r',
    resolve(root, 'examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('shell', 'am', 'force-stop', app)
  adb('shell', 'run-as', app, 'rm', '-f', 'files/performance-check.json')
  adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  stopApp = () => adb('shell', 'am', 'force-stop', app)
  readReport = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/performance-check.json'))
} else if (platform === 'ios-device') {
  const deviceRun = (operation, action, ...args) =>
    run('xcrun', [
      'devicectl',
      'device',
      operation,
      action,
      '--device',
      device,
      '--timeout',
      '30',
      ...args,
    ])
  const details = JSON.parse(deviceRun('info', 'details', '--json-output', '-')).result
  metadata.hardware = details.hardwareProperties.productType
  metadata.deviceName = details.hardwareProperties.marketingName
  metadata.osBuild = details.deviceProperties.osBuildUpdate
  deviceRun(
    'install',
    'app',
    process.env.MAVIS_DEVICE_APP ??
      resolve(
        root,
        'examples/catalog/platforms/ios/build/Debug-iphoneos/catalog.xcarchive/Products/Applications/catalog.app',
      ),
  )
  const file = resolve(output, 'device-report.json')
  writeFileSync(file, '{}')
  const domain = ['--domain-type', 'appDataContainer', '--domain-identifier', app]
  deviceRun(
    'copy',
    'to',
    '--source',
    file,
    '--destination',
    'Documents/performance-check.json',
    ...domain,
  )
  const launched = JSON.parse(
    deviceRun('process', 'launch', '--terminate-existing', '--json-output', '-', app),
  )
  stopApp = () =>
    deviceRun('process', 'terminate', '--pid', String(launched.result.processIdentifier), '--kill')
  readReport = () => {
    deviceRun(
      'copy',
      'from',
      '--source',
      'Documents/performance-check.json',
      '--destination',
      file,
      ...domain,
    )
    return JSON.parse(readFileSync(file, 'utf8'))
  }
} else {
  const devices = Object.values(JSON.parse(simctl('list', 'devices', '--json')).devices).flat()
  metadata.hardware = devices.find((entry) => entry.udid === device)?.deviceTypeIdentifier
  metadata.contentSize = simctl('ui', device, 'content_size')
  simctl(
    'install',
    device,
    resolve(root, 'examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  )
  const file = resolve(
    simctl('get_app_container', device, app, 'data'),
    'Documents/performance-check.json',
  )
  rmSync(file, { force: true })
  simctl('launch', '--terminate-running-process', device, app)
  stopApp = () => simctl('terminate', device, app)
  readReport = () => JSON.parse(readFileSync(file, 'utf8'))
}
let report
let stage
const timeout = Number(process.env.MAVIS_PERFORMANCE_TIMEOUT ?? 180)
if (!Number.isFinite(timeout) || timeout < 1 || timeout > 600) throw new Error('Invalid timeout')
const deadline = Date.now() + timeout * 1000
while (Date.now() < deadline) {
  await setTimeout(1500)
  try {
    report = readReport()
    if (!report.environment) continue
  } catch {
    continue
  }
  report.environment.target =
    platform === 'android'
      ? device.startsWith('emulator-')
        ? 'emulator'
        : 'physical'
      : platform === 'ios-device'
        ? 'physical'
        : 'simulator'
  Object.assign(report.environment, metadata)
  writeFileSync(resolve(output, 'measurements.json'), JSON.stringify(report, null, 2))
  if (stage !== report.stage) {
    stage = report.stage
    console.log(stage)
  }
  if (report.complete || report.error) break
}
if (!report?.complete) {
  try {
    stopApp()
  } catch {
    /* The process may already have exited. */
  }
  throw new Error(report?.error ?? `Timed out at ${report?.stage ?? 'startup'}`)
}
validateReport(report)
console.log(`${name}: report saved to ${output}`)
