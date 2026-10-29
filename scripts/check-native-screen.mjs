import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'

const [platform, device, name = platform] = process.argv.slice(2)
if (!['android', 'ios'].includes(platform) || !device || !/^[\w-]+$/.test(name)) {
  throw new Error('Usage: node scripts/check-native-screen.mjs android|ios DEVICE [capture-name]')
}
const root = resolve(import.meta.dirname, '..')
const app = 'com.getcortexlabs.mavis.catalog'
const output = resolve(root, 'artifacts/screen', name)
mkdirSync(output, { recursive: true })
const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const adb = (...args) => run('adb', ['-s', device, ...args])
const simctl = (...args) => run('xcrun', ['simctl', ...args])
let readSamples
let capture
let background
let resume
if (platform === 'android') {
  adb(
    'install',
    '-r',
    resolve(root, 'examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('shell', 'am', 'force-stop', app)
  adb('shell', 'run-as', app, 'rm', '-f', 'files/screen-check.json')
  resume = () => adb('shell', 'am', 'start', '-n', app + '/com.tns.NativeScriptActivity')
  resume()
  readSamples = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/screen-check.json'))
  capture = (stage) =>
    writeFileSync(
      resolve(output, stage + '.png'),
      execFileSync('adb', ['-s', device, 'exec-out', 'screencap', '-p']),
    )
  background = () => adb('shell', 'input', 'keyevent', 'KEYCODE_HOME')
} else {
  // idb sends Home to this simulator only, without changing other running simulators.
  const idb = process.env.IDB_PATH || 'idb'
  run(idb, ['--help'])
  simctl(
    'install',
    device,
    resolve(root, 'examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  )
  const file = resolve(
    simctl('get_app_container', device, app, 'data'),
    'Documents/screen-check.json',
  )
  rmSync(file, { force: true })
  simctl('launch', '--terminate-running-process', device, app)
  readSamples = () => JSON.parse(readFileSync(file, 'utf8'))
  capture = (stage) => simctl('io', device, 'screenshot', resolve(output, stage + '.png'))
  background = () => run(idb, ['ui', 'button', 'HOME', '--udid', device])
  resume = () => simctl('launch', device, app)
}
let samples = []
let previous = ''
let cycled = false
const deadline = Date.now() + 60_000
while (Date.now() < deadline) {
  await setTimeout(250)
  try {
    samples = readSamples()
  } catch {
    continue
  }
  const stage = samples.at(-1)?.stage
  if (stage && stage !== previous) {
    if (['initial', 'scrolled', 'editing', 'next', 'landscape-editing', 'resumed'].includes(stage))
      capture(stage)
    previous = stage
  }
  if (stage === 'portrait' && !cycled) {
    background()
    await setTimeout(1200)
    resume()
    cycled = true
  }
  if (stage === 'resumed') break
}
writeFileSync(resolve(output, 'measurements.json'), JSON.stringify(samples, null, 2))
if (samples.length !== 12 || !cycled)
  throw new Error(
    'Missing stages. Build with --env.screenCheck and keep the software keyboard enabled.',
  )
const failures = samples.flatMap(({ stage, failures }) =>
  failures.map((failure) => stage + ': ' + failure),
)
if (failures.length) throw new Error(failures.join('\n'))
console.log(name + ': 12 screen checks passed. Captures: ' + output)
