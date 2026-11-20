import { execFileSync, spawn } from 'node:child_process'
import { statSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

/** Capture the simulator/emulator framebuffer; this is not physical-device evidence. */
export async function nativeRecording(platform, device, file) {
  const path = '/sdcard/mavis-acceptance.mp4'
  const process =
    platform === 'ios'
      ? spawn('xcrun', ['simctl', 'io', device, 'recordVideo', '--codec=h264', file], {
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : spawn('adb', ['-s', device, 'shell', 'screenrecord', '--time-limit', '180', path], {
          stdio: 'ignore',
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
    if (platform === 'android') {
      await delay(1000)
      try {
        execFileSync('adb', ['-s', device, 'shell', 'pkill', '-2', 'screenrecord'])
      } catch {}
      await delay(500)
      execFileSync('adb', ['-s', device, 'pull', path, file], { stdio: 'inherit' })
    }
    if (!statSync(file).size) throw new Error('Recorder produced an empty video')
  }
}
