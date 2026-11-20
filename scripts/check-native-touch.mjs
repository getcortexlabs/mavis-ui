import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const [platform, device] = process.argv.slice(2)
if (!['ios', 'android'].includes(platform) || !device)
  throw new Error('Expected ios|android DEVICE')
const app = 'com.getcortexlabs.mavis.catalog'
const output = resolve('artifacts/touch', platform)
mkdirSync(output, { recursive: true })
const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', timeout: 300000, ...options }).trim()
const adb = (...args) => run('adb', ['-s', device, ...args])
const sim = (...args) => run('xcrun', ['simctl', ...args])
let read, capture, recorder
if (platform === 'ios') {
  sim(
    'install',
    device,
    resolve('examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
  )
  const file = resolve(sim('get_app_container', device, app, 'data'), 'Documents/touch-check.json')
  rmSync(file, { force: true })
  sim('launch', '--terminate-running-process', device, app)
  read = () => JSON.parse(readFileSync(file, 'utf8'))
  capture = (name) => sim('io', device, 'screenshot', resolve(output, `${name}.png`))
} else {
  adb(
    'install',
    '-r',
    resolve('examples/catalog/platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
  )
  adb('shell', 'am', 'force-stop', app)
  adb('shell', 'run-as', app, 'rm', '-f', 'files/touch-check.json')
  adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
  read = () => JSON.parse(adb('shell', 'run-as', app, 'cat', 'files/touch-check.json'))
  capture = (name) =>
    writeFileSync(
      resolve(output, `${name}.png`),
      execFileSync('adb', ['-s', device, 'exec-out', 'screencap', '-p']),
    )
}
const samples = []
async function wait(check, label) {
  for (let i = 0; i < 100; i++) {
    await delay(200)
    let data
    try {
      data = read()
    } catch {
      continue
    }
    if (data.errors.length) throw new Error(data.errors.join('\n'))
    if (check(data)) {
      samples.push({ label, ...data })
      return data
    }
  }
  throw new Error(`Timed out: ${label}`)
}
const near = (a, b, label) => {
  if (Math.abs(a - b) > 1.1) throw new Error(`${label}: ${a} != ${b}`)
}
try {
  const initial = await wait((data) => data.views['touch-percent']?.width > 0, 'initial')
  const box = initial.views['touch-box']
  for (const [id, width, height] of [
    ['touch-fixed', 60, 30],
    ['touch-percent', 92, 10],
    ['touch-fill', 184, 84],
  ]) {
    const child = initial.views[id]
    near(child.x, box.x + 8, `${id} left`)
    near(child.y, box.y + 8, `${id} top`)
    near(child.width, width, `${id} width`)
    near(child.height, height, `${id} height`)
  }
  capture('initial-layers')
  const textBox = initial.views['touch-text-box'],
    text = initial.views['touch-text']
  near(text.y, textBox.y, 'plain text layer top')
  if (text.height > textBox.height / 2)
    throw new Error('Plain text stretched into a vertically centred label')
  if (platform === 'ios') {
    recorder = spawn(
      'xcrun',
      ['simctl', 'io', device, 'recordVideo', '--codec=h264', resolve(output, 'touch.mp4')],
      { stdio: 'ignore' },
    )
    run('ruby', ['scripts/native-input-project.rb', resolve(output, 'project')])
    const result = execFileSync(
      'xcodebuild',
      [
        'test',
        '-project',
        resolve(output, 'project/MavisInput.xcodeproj'),
        '-scheme',
        'MavisInputTests',
        '-destination',
        `platform=iOS Simulator,id=${device}`,
        '-derivedDataPath',
        resolve(output, 'build'),
        '-resultBundlePath',
        resolve(output, 'results.xcresult'),
        'CODE_SIGNING_ALLOWED=NO',
      ],
      { timeout: 300000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    writeFileSync(resolve(output, 'xcodebuild.log'), result)
  } else {
    recorder = spawn(
      'adb',
      ['-s', device, 'shell', 'screenrecord', '--time-limit', '120', '/sdcard/mavis-touch.mp4'],
      { stdio: 'ignore' },
    )
    const tap = (id) => {
      const { views, scale } = read()
      const rect = views[id]
      adb(
        'shell',
        'input',
        'tap',
        String(Math.round((rect.x + rect.width / 2) * scale)),
        String(Math.round((rect.y + rect.height / 2) * scale)),
      )
    }
    tap('touch-under')
    await wait((d) => d.views['touch-count']?.text === 'Underneath 1', 'tap-through')
    tap('touch-replace')
    await wait((d) => d.views['touch-decoration-replaced'], 'replaced-layer')
    tap('touch-under')
    await wait((d) => d.views['touch-count']?.text === 'Underneath 2', 'tap-through-replacement')
    tap('touch-overlay-action')
    await wait((d) => d.views['touch-overlay-count']?.text === 'Overlay taps 1', 'overlay-action')
    capture('overlay-action')
    const size = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)/)
    const width = Number(size[1]),
      height = Number(size[2])
    for (let i = 0; i < 5; i++) {
      const data = read(),
        bottom = data.views['touch-bottom']
      if (bottom && (bottom.y + bottom.height) * data.scale < height - 90) break
      adb(
        'shell',
        'input',
        'swipe',
        String(Math.round(width * 0.3)),
        String(Math.round(height * 0.75)),
        String(Math.round(width * 0.3)),
        String(Math.round(height * 0.25)),
        '450',
      )
      await delay(700)
    }
    tap('touch-bottom')
  }
  const final = await wait(
    (d) => d.views['touch-bottom-count']?.text === 'Bottom 1' && d.scroll > 100,
    'scrolled-and-tapped',
  )
  capture('scrolled-through-overlay')
  if (final.views['touch-overlay-count']?.text !== 'Overlay taps 1')
    throw new Error('Overlay control did not receive its tap')
  if (final.views['touch-count'].text !== 'Underneath 2')
    throw new Error('Underlying taps not delivered exactly once')
  console.log(
    `${platform}: OS taps and scrolling passed through nested decorative overlays; fixed, percentage and fill layers agree`,
  )
} catch (error) {
  try {
    samples.push({ label: 'failure', ...read() })
    capture('failure')
  } catch {}
  if (error.stdout) writeFileSync(resolve(output, 'xcodebuild.log'), error.stdout)
  if (error.stderr) writeFileSync(resolve(output, 'error.log'), error.stderr)
  throw error
} finally {
  recorder?.kill('SIGINT')
  await delay(1000)
  if (platform === 'android' && recorder) {
    // Signal the device-side recorder as well; adb's host process can exit first.
    try {
      adb('shell', 'pkill', '-2', 'screenrecord')
    } catch {}
    await delay(500)
    try {
      adb('pull', '/sdcard/mavis-touch.mp4', resolve(output, 'touch.mp4'))
    } catch {}
  }
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(samples, null, 2))
}
