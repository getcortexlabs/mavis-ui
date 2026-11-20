import { execFileSync, spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

/** Capture the simulator/emulator framebuffer; this is not physical-device evidence. */
export function nativeRecording(platform, device, file) {
  const path = '/sdcard/mavis-acceptance.mp4'
  const process =
    platform === 'ios'
      ? spawn('xcrun', ['simctl', 'io', device, 'recordVideo', '--codec=h264', file], {
          stdio: 'ignore',
        })
      : spawn('adb', ['-s', device, 'shell', 'screenrecord', '--time-limit', '180', path], {
          stdio: 'ignore',
        })
  return async () => {
    process.kill('SIGINT')
    await delay(1000)
    if (platform === 'android') {
      try {
        execFileSync('adb', ['-s', device, 'shell', 'pkill', '-2', 'screenrecord'])
      } catch {}
      await delay(500)
      execFileSync('adb', ['-s', device, 'pull', path, file], { stdio: 'inherit' })
    }
  }
}
