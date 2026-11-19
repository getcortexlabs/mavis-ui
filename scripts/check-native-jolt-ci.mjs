import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const platform = process.argv[2]
if (!['ios', 'android'].includes(platform))
  throw new Error('Usage: node scripts/check-native-jolt-ci.mjs ios|android')
const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', timeout: 180000 }).trim()
const output = resolve('artifacts/jolt15', platform)
mkdirSync(output, { recursive: true })
let device,
  runtime,
  booted = false
if (platform === 'ios') {
  const devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']))
  for (const [name, entries] of Object.entries(devices.devices)) {
    if (!name.includes('iOS')) continue
    const phone = entries.find((entry) => entry.isAvailable && entry.name.startsWith('iPhone'))
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
      input: 'NativeScript events and native presentation measurements; no physical touch replay',
    },
    null,
    2,
  ) + '\n',
)
try {
  execFileSync(process.execPath, ['scripts/check-native-jolt15.mjs', platform, device], {
    stdio: 'inherit',
    timeout: 240000,
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
  } finally {
    if (booted) run('xcrun', ['simctl', 'shutdown', device])
  }
}
