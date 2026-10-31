import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'

const [platform, device, name = `${platform}-phone`] = process.argv.slice(2)
if (!['android', 'ios'].includes(platform) || !device || !/^[\w-]+$/.test(name)) {
  throw new Error('Usage: node scripts/check-native-layout.mjs android|ios DEVICE [capture-name]')
}
const root = resolve(import.meta.dirname, '..')
const app = 'com.getcortexlabs.mavis.catalog'
const output = resolve(root, 'artifacts/layout', name)
mkdirSync(output, { recursive: true })
const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const adb = (...args) => run('adb', ['-s', device, ...args])
const simctl = (...args) => run('xcrun', ['simctl', ...args])
let readSamples
if (platform === 'android') {
  adb(
    'install',
    '-r',
    resolve(root, 'examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('shell', 'am', 'force-stop', app)
  adb('shell', 'run-as', app, 'rm', '-f', 'files/layout-check.json')
  adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  readSamples = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/layout-check.json'))
} else {
  simctl(
    'install',
    device,
    resolve(root, 'examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  )
  const file = resolve(
    simctl('get_app_container', device, app, 'data'),
    'Documents/layout-check.json',
  )
  rmSync(file, { force: true })
  simctl('launch', '--terminate-running-process', device, app)
  readSamples = () => JSON.parse(readFileSync(file, 'utf8'))
}

let samples = []
const deadline = Date.now() + 30_000
while (Date.now() < deadline) {
  await setTimeout(2000)
  try {
    samples = readSamples()
    if (samples.length === 8) break
  } catch {
    // The first sample is written after the application has mounted.
  }
}
writeFileSync(resolve(output, 'measurements.json'), JSON.stringify(samples, null, 2))
if (platform === 'android') {
  writeFileSync(
    resolve(output, 'screen.png'),
    execFileSync('adb', ['-s', device, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 }),
  )
} else {
  simctl('io', device, 'screenshot', resolve(output, 'screen.png'))
}
if (samples.length !== 8)
  throw new Error('Missing samples. Build the catalog with --env.layoutCheck first.')
if (samples[0].rotate) {
  const initial = samples[0].views['layout-check'].width
  const landscape = samples[2].views['layout-check'].width
  const restored = samples[7].views['layout-check'].width
  if (landscape <= initial || Math.abs(restored - initial) > 1) {
    throw new Error(`Orientation did not change and return: ${initial}, ${landscape}, ${restored}`)
  }
}
const failures = samples.flatMap(({ sample, failures }) =>
  failures.map((message) => `${sample}: ${message}`),
)
if (failures.length) throw new Error(failures.join('\n'))
console.log(`${name}: 8 geometry checks passed. Captures: ${output}`)
