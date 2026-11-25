import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { nativeRecording } from './native-recording.mjs'

export async function runRecordedCatalog({ name, directory, video }) {
  const [platform, device, language = 'en'] = process.argv.slice(2)
  if (!['android', 'ios'].includes(platform) || !device)
    throw new Error('Expected a platform (android|ios) and a device identifier')
  const app = 'com.getcortexlabs.mavis.catalog'
  const run = (cmd, args) =>
    execFileSync(cmd, args, {
      encoding: 'utf8',
      timeout: cmd === 'xcrun' && ['install', 'launch'].includes(args[1]) ? 180000 : 60000,
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  if (!['en', 'pt'].includes(language)) throw new Error('Expected en|pt')
  const output = resolve('artifacts', directory, platform, language)
  mkdirSync(output, { recursive: true })
  let read, launch
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
    adb('shell', 'run-as', app, 'rm', '-f', `files/${name}-check.json`)
    adb('shell', 'run-as', app, 'mkdir', '-p', 'files')
    execFileSync(
      'adb',
      ['-s', device, 'shell', 'run-as', app, 'tee', `files/${name}-language.txt`],
      { input: language, stdio: ['pipe', 'ignore', 'pipe'] },
    )
    launch = () => adb('shell', 'am', 'start', '-n', `${app}/com.tns.NativeScriptActivity`)
    read = () => JSON.parse(adb('shell', 'run-as', app, 'cat', `files/${name}-check.json`))
  } else {
    const sim = (...args) => run('xcrun', ['simctl', ...args])
    sim(
      'install',
      device,
      resolve('examples/catalog/platforms/ios/build/Debug-iphonesimulator/catalog.app'),
    )
    const file = resolve(
      sim('get_app_container', device, app, 'data'),
      `Documents/${name}-check.json`,
    )
    rmSync(file, { force: true })
    writeFileSync(resolve(file, '..', `${name}-language.txt`), language)
    launch = () => sim('launch', '--terminate-running-process', device, app)
    read = () => JSON.parse(readFileSync(file, 'utf8'))
  }
  let report, acceptanceError
  const stopRecording = await nativeRecording(platform, device, resolve(output, video))
  try {
    launch()
    for (let attempt = 0; attempt < 90; attempt++) {
      await delay(1000)
      try {
        report = read()
      } catch {
        continue
      }
      if (report.done) break
    }
    if (report) {
      const result = JSON.stringify(report, null, 2)
      writeFileSync(resolve(output, 'report.json'), result)
      if (name === 'visual' && !process.argv[4])
        writeFileSync(resolve(output, '..', 'report.json'), result)
    }
    if (!report?.done) throw new Error(`${name} probe did not complete`)
    if (name === 'visual' && report.language !== language)
      throw new Error('Unexpected visual probe language')
    console.log(JSON.stringify(report, null, 2))
    if (report.failures.length) throw new Error(report.failures.join('\n'))
  } catch (error) {
    acceptanceError = error
    throw error
  } finally {
    try {
      collectLogs()
    } catch (error) {
      console.warn(`Could not collect native logs: ${error.message}`)
    }
    try {
      await stopRecording()
    } catch (error) {
      if (!acceptanceError) throw error
      console.warn(`Could not finalize native recording: ${error.message}`)
    }
  }
}
