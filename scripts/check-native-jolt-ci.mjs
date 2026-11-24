import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const platform = process.argv[2]
const probe = process.argv.find((arg) => arg.startsWith('--probe='))?.slice(8) ?? 'jolt15'
const buildFlag = {
  jolt15: 'jolt15Check',
  pointer: 'pointerCheck',
  'screen-components': 'screenComponentsCheck',
  touch: 'touchCheck',
  dashboard: 'dashboardCheck',
  preference: 'preferenceCheck',
}[probe]
if (!buildFlag) throw new Error('Unknown native probe')
if (!['ios', 'android'].includes(platform))
  throw new Error('Usage: node scripts/check-native-jolt-ci.mjs ios|android')
if (process.argv.includes('--build'))
  execFileSync('ns', ['build', platform, `--env.${buildFlag}`], {
    cwd: resolve('examples/catalog'),
    stdio: 'inherit',
    timeout: 900000,
  })
const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', timeout: 180000 }).trim()
const output = resolve('artifacts', probe, platform)
mkdirSync(output, { recursive: true })
let device,
  runtime,
  booted = false
if (platform === 'ios') {
  const devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']))
  for (const [name, entries] of Object.entries(devices.devices)) {
    if (!name.includes('iOS')) continue
    const phone = entries.find(
      (entry) =>
        entry.isAvailable &&
        entry.name.startsWith(['dashboard', 'preference'].includes(probe) ? 'iPad' : 'iPhone'),
    )
    if (phone) {
      device = phone.udid
      runtime = name
      if (phone.state !== 'Booted') {
        run('xcrun', ['simctl', 'boot', device])
        booted = true
      }
      break
    }
  }
  if (!device) throw new Error('No available iPhone simulator')
  run('xcrun', ['simctl', 'bootstatus', device, '-b'])
} else {
  device = run('adb', ['devices'])
    .split('\n')
    .find((line) => /^emulator-\d+\s+device$/.test(line))
    ?.split(/\s/)[0]
  if (!device) throw new Error('No booted Android emulator')
  runtime = run('adb', ['-s', device, 'shell', 'getprop', 'ro.build.version.release'])
  if (['dashboard', 'preference'].includes(probe)) {
    run('adb', ['-s', device, 'shell', 'wm', 'size', '1000x1400'])
    run('adb', ['-s', device, 'shell', 'wm', 'density', '160'])
  }
}
const catalog = JSON.parse(readFileSync('examples/catalog/package.json', 'utf8'))
const installed = JSON.parse(
  readFileSync('examples/catalog/node_modules/@rafaelaugusto/jolt/package.json', 'utf8'),
)
if (installed.version !== catalog.dependencies['@rafaelaugusto/jolt'])
  throw new Error('Native catalog Jolt installation does not match its pin')
writeFileSync(
  resolve(output, 'environment.json'),
  JSON.stringify(
    {
      platform,
      runtime,
      device,
      node: process.version,
      jolt: installed.version,
      nativeScript: catalog.devDependencies[`@nativescript/${platform}`],
      input:
        probe === 'touch'
          ? 'OS touch injection: XCUITest coordinates / adb input'
          : 'NativeScript events and native presentation measurements; no physical touch replay',
    },
    null,
    2,
  ) + '\n',
)
let previousImeSetting
const imePreference = ['-s', device, 'shell', 'settings']
try {
  if (platform === 'android' && probe === 'screen-components') {
    previousImeSetting = run('adb', [
      ...imePreference,
      'get',
      'secure',
      'show_ime_with_hard_keyboard',
    ])
    run('adb', [...imePreference, 'put', 'secure', 'show_ime_with_hard_keyboard', '1'])
  }
  execFileSync(process.execPath, [`scripts/check-native-${probe}.mjs`, platform, device], {
    stdio: 'inherit',
    timeout: 660000,
  })
  if (probe === 'dashboard')
    execFileSync(process.execPath, ['scripts/check-native-dashboard.mjs', platform, device, 'pt'], {
      stdio: 'inherit',
      timeout: 660000,
    })
} finally {
  try {
    if (platform === 'ios')
      run('xcrun', ['simctl', 'io', device, 'screenshot', resolve(output, 'final.png')])
    else
      writeFileSync(
        resolve(output, 'logcat.txt'),
        run('adb', ['-s', device, 'logcat', '-d', '-t', '2000']),
      )
  } catch (error) {
    // Diagnostics are supplementary; never replace the probe's success or failure.
    console.warn(`Native diagnostic collection failed: ${error.message}`)
    writeFileSync(resolve(output, 'diagnostic-collection-error.txt'), String(error.stack ?? error))
  } finally {
    if (previousImeSetting !== undefined) {
      const restore =
        previousImeSetting === 'null'
          ? ['delete', 'secure', 'show_ime_with_hard_keyboard']
          : ['put', 'secure', 'show_ime_with_hard_keyboard', previousImeSetting]
      run('adb', [...imePreference, ...restore])
    }
    if (booted) run('xcrun', ['simctl', 'shutdown', device])
  }
}
