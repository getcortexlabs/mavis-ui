import { execFile, execFileSync, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const [platform, device, name = `${platform}-${Date.now()}`] = process.argv.slice(2)
if (!['android', 'ios'].includes(platform) || !device || !/^[\w-]+$/.test(name)) {
  throw new Error(
    'Usage: node scripts/check-native-accessibility.mjs android|ios DEVICE [run-name]',
  )
}
const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'artifacts/accessibility', name)
const source = resolve(root, 'test/native/accessibility', platform)
const build = resolve(output, 'runner')
mkdirSync(build, { recursive: true })
const app = 'com.getcortexlabs.mavis.catalog'
const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options })
const adb = (...args) => run('adb', ['-s', device, ...args])

if (platform === 'ios') {
  const tests =
    process.env.ACCESSIBILITY_INSERT === '1'
      ? ['testInsertedStatus']
      : process.env.ACCESSIBILITY_REPEAT === '1'
        ? ['testRepeatedLoading']
        : ['testVoiceOver', 'testRepeatedLoading']
  if (existsSync(resolve(output, 'Audit.xcresult')))
    throw new Error('This run already has an xcresult. Choose a new run name.')
  copyFileSync(resolve(source, 'Audit.m'), resolve(build, 'Audit.m'))
  run(process.env.RUBY || 'ruby', [resolve(source, 'create.rb'), build])
  run('xcrun', [
    'simctl',
    'install',
    device,
    resolve(root, 'examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  ])
  try {
    const log = run(
      'xcodebuild',
      [
        '-project',
        resolve(build, 'Audit.xcodeproj'),
        '-scheme',
        'Audit',
        ...tests.flatMap((name) => ['-only-testing', `Audit/Audit/${name}`]),
        '-collect-test-diagnostics',
        'never',
        '-destination',
        `platform=iOS Simulator,id=${device}`,
        '-derivedDataPath',
        resolve(build, 'derived'),
        '-resultBundlePath',
        resolve(output, 'Audit.xcresult'),
        'test',
      ],
      { maxBuffer: 20 * 1024 * 1024, timeout: 600_000 },
    )
    writeFileSync(resolve(output, 'voiceover.log'), log)
  } catch (error) {
    writeFileSync(
      resolve(output, 'voiceover.log'),
      String(error.stdout || '') + String(error.stderr || ''),
    )
    throw new Error(`iOS accessibility audit failed. See ${resolve(output, 'voiceover.log')}`)
  }
} else {
  if (
    !adb('shell', 'settings', 'get', 'secure', 'enabled_accessibility_services').includes(
      'talkback',
    )
  ) {
    throw new Error('Enable TalkBack on this emulator before running the audit.')
  }
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    resolve(homedir(), process.platform === 'darwin' ? 'Library/Android/sdk' : 'Android/Sdk')
  const version = process.env.ANDROID_BUILD_TOOLS || '36.0.0'
  const androidJar = resolve(
    sdk,
    'platforms',
    `android-${process.env.ANDROID_API || '36'}`,
    'android.jar',
  )
  const tool = (name) => resolve(sdk, 'build-tools', version, name)
  for (const directory of ['classes', 'dex'])
    mkdirSync(resolve(build, directory), { recursive: true })
  copyFileSync(resolve(source, 'AndroidManifest.xml'), resolve(build, 'AndroidManifest.xml'))
  run('javac', [
    '-source',
    '8',
    '-target',
    '8',
    '-cp',
    androidJar,
    '-d',
    resolve(build, 'classes'),
    resolve(source, 'Audit.java'),
  ])
  run(tool('d8'), [
    '--lib',
    androidJar,
    '--output',
    resolve(build, 'dex'),
    resolve(build, 'classes/com/getcortexlabs/mavis/checks/Audit.class'),
  ])
  run(tool('aapt2'), [
    'link',
    '-I',
    androidJar,
    '--manifest',
    resolve(build, 'AndroidManifest.xml'),
    '--min-sdk-version',
    '30',
    '--target-sdk-version',
    '36',
    '-o',
    resolve(build, 'unsigned.apk'),
  ])
  run('zip', ['-j', '-q', resolve(build, 'unsigned.apk'), resolve(build, 'dex/classes.dex')])
  run(tool('zipalign'), ['-f', '4', resolve(build, 'unsigned.apk'), resolve(build, 'aligned.apk')])
  run(tool('apksigner'), [
    'sign',
    '--ks',
    resolve(homedir(), '.android/debug.keystore'),
    '--ks-key-alias',
    'androiddebugkey',
    '--ks-pass',
    'pass:android',
    '--key-pass',
    'pass:android',
    '--out',
    resolve(build, 'audit.apk'),
    resolve(build, 'aligned.apk'),
  ])
  adb(
    'install',
    '-r',
    resolve(root, 'examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('install', '-r', resolve(build, 'audit.apk'))
  const reader = spawn('adb', ['-s', device, 'logcat', '-v', 'time', '-T', '1'])
  const readerClosed = new Promise((resolve) => reader.once('close', resolve))
  let pending = '',
    speech = ''
  reader.stdout.on('data', (chunk) => {
    pending += String(chunk)
    const lines = pending.split('\n')
    pending = lines.pop() || ''
    const spoken = lines.filter((line) => /Speaking fragment|MavisAudit/.test(line))
    if (spoken.length) speech += spoken.join('\n') + '\n'
  })
  let result
  try {
    result = (
      await promisify(execFile)('adb', [
        '-s',
        device,
        'shell',
        'am',
        'instrument',
        '-w',
        'com.getcortexlabs.mavis.accessibility.tests/com.getcortexlabs.mavis.checks.Audit',
      ])
    ).stdout
  } finally {
    reader.kill('SIGINT')
    await readerClosed
    writeFileSync(resolve(output, 'talkback.log'), speech)
  }
  writeFileSync(resolve(output, 'instrumentation.log'), result)
  writeFileSync(
    resolve(output, 'samples.json'),
    adb('shell', 'run-as', app, 'cat', 'files/accessibility-check.json'),
  )
  if (!speech.includes('Speaking fragment'))
    throw new Error(
      'No TalkBack speech captured. Enable verbose logging in its developer settings.',
    )
  if (!result.includes('INSTRUMENTATION_CODE: -1')) throw new Error(result)
  for (const theme of ['mavis', 'midnight']) {
    for (const stage of ['theme', 'slider-increase', 'close-details', 'ready']) {
      writeFileSync(
        resolve(output, `${theme}-${stage}.png`),
        execFileSync('adb', [
          '-s',
          device,
          'exec-out',
          'run-as',
          app,
          'cat',
          `files/a11y-${theme}-${stage}.png`,
        ]),
      )
    }
  }
  const samples = JSON.parse(readFileSync(resolve(output, 'samples.json'), 'utf8'))
  if (!samples.some((sample) => sample.theme === 'midnight' && sample.stage === 'disabled-slider'))
    throw new Error('Incomplete audit')
}
console.log(`${platform}: accessibility audit passed. Evidence: ${output}`)
