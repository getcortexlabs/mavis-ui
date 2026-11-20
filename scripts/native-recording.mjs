import { execFileSync, spawn } from 'node:child_process'
import { statSync, writeFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

async function androidRecording(device, file) {
  const path = '/sdcard/mavis-acceptance.mp4'
  const adb = (args) =>
    execFileSync('adb', ['-s', device, ...args], { encoding: 'utf8', timeout: 10000 })
  adb(['shell', 'rm', '-f', path])
  const recorder = spawn(
    'adb',
    ['-s', device, 'shell', 'screenrecord', '--time-limit', '180', path],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let diagnostic = ''
  const append = (value) => {
    diagnostic = (diagnostic + value).slice(-64000)
  }
  recorder.stdout.on('data', append)
  recorder.stderr.on('data', append)
  const closed = new Promise((resolve) => {
    recorder.once('error', (error) => resolve({ error }))
    recorder.once('close', (code, signal) => resolve({ code, signal }))
  })
  return async () => {
    let timer
    try {
      if (recorder.exitCode === null && !recorder.signalCode) {
        // Signal the device encoder first. Killing its adb shell can interrupt
        // MP4 finalization, even though the app's acceptance has already passed.
        try {
          adb(['shell', 'pkill', '-2', 'screenrecord'])
        } catch (error) {
          append(`Could not signal recorder: ${error.message}\n`)
        }
      }
      const result = await Promise.race([
        closed,
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error('Android recorder did not finish writing the video'))
            recorder.kill('SIGKILL')
          }, 30000)
        }),
      ])
      clearTimeout(timer)
      if (result.error) throw result.error
      if (result.code !== 0)
        throw new Error(`Android recorder exited (${result.code}, ${result.signal}): ${diagnostic}`)
      // Finalization is complete; only the transport is retried, never acceptance.
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          adb(['pull', path, file])
          break
        } catch (error) {
          append(`Video copy attempt ${attempt}: ${error.message}\n`)
          if (attempt === 3) throw error
          await delay(500)
        }
      }
      if (!statSync(file).size) throw new Error('Recorder produced an empty video')
    } catch (error) {
      append(`${error.stack ?? error}\n`)
      throw error
    } finally {
      clearTimeout(timer)
      writeFileSync(`${file}.log`, diagnostic)
    }
  }
}

/** Capture the simulator/emulator framebuffer; this is not physical-device evidence. */
export async function nativeRecording(platform, device, file) {
  if (platform === 'android') return androidRecording(device, file)
  const process = spawn('xcrun', ['simctl', 'io', device, 'recordVideo', '--codec=h264', file], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (platform === 'ios') {
    // simctl can take longer to attach the recorder than the app's entire probe.
    // Launching only after this acknowledgement keeps the transitions in the video.
    await new Promise((resolve, reject) => {
      let output = ''
      const finish = (error) => {
        clearTimeout(timer)
        process.off('error', failed)
        process.off('exit', exited)
        process.stdout.off('data', data)
        process.stderr.off('data', data)
        process.stdout.resume()
        process.stderr.resume()
        if (error) {
          process.kill('SIGINT')
          reject(error)
        } else resolve()
      }
      const failed = (error) => finish(error)
      const exited = (code) =>
        finish(new Error(`Recorder exited before readiness (${code}): ${output}`))
      const data = (chunk) => {
        output = (output + chunk).slice(-8000)
        if (/Recording started/i.test(output)) finish()
      }
      const timer = setTimeout(
        () => finish(new Error(`Recorder did not become ready: ${output}`)),
        45000,
      )
      process.once('error', failed)
      process.once('exit', exited)
      process.stdout.on('data', data)
      process.stderr.on('data', data)
    })
  }
  return async () => {
    if (platform === 'ios' && process.exitCode === null) {
      await new Promise((resolve, reject) => {
        // A busy hosted simulator can need more than ten seconds to flush H.264.
        const timer = setTimeout(() => {
          process.kill('SIGKILL')
          reject(new Error('Recorder did not finish writing the video'))
        }, 30000)
        process.once('close', () => {
          clearTimeout(timer)
          resolve()
        })
        process.kill('SIGINT')
      })
    } else process.kill('SIGINT')
    if (!statSync(file).size) throw new Error('Recorder produced an empty video')
  }
}
