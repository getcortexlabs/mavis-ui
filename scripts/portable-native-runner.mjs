import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'

// Stop after the first completed failing test. SIGINT lets xcodebuild finalize
// its result bundle; bounded escalation also cleans up a stuck test runner.
export function runNativeCommand(
  command,
  args,
  { cwd, logPath, timeoutMs = 25 * 60_000, graceMs = 10_000, output = process.stdout } = {},
) {
  return new Promise((resolve, reject) => {
    const log = logPath ? createWriteStream(logPath) : null
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const tails = new Map()
    let reason, escalation, force
    const signal = (value) => {
      try {
        process.platform === 'win32' ? child.kill(value) : process.kill(-child.pid, value)
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
    const stop = (message) => {
      if (reason) return
      reason = message
      output?.write(`\n${message}\n`)
      signal('SIGINT')
      escalation = setTimeout(() => signal('SIGTERM'), graceMs)
      force = setTimeout(() => signal('SIGKILL'), graceMs * 2)
    }
    const interrupted = () => stop('Native conformance interrupted.')
    process.once('SIGINT', interrupted)
    process.once('SIGTERM', interrupted)
    const timeout = setTimeout(() => stop(`Native command exceeded ${timeoutMs} ms.`), timeoutMs)
    const line = (text) => {
      if (/Test Case .+ failed \(/.test(text))
        stop(`Stopping native conformance after its first failed test: ${text.trim()}`)
    }
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding('utf8')
      stream.on('data', (chunk) => {
        output?.write(chunk)
        log?.write(chunk)
        const lines = ((tails.get(stream) ?? '') + chunk).split(/\r?\n/)
        tails.set(stream, lines.pop())
        for (const text of lines) line(text)
      })
    }
    child.on('error', (error) => {
      reason = error.message
    })
    child.on('close', (code, termination) => {
      clearTimeout(timeout)
      clearTimeout(escalation)
      clearTimeout(force)
      process.removeListener('SIGINT', interrupted)
      process.removeListener('SIGTERM', interrupted)
      for (const tail of tails.values()) {
        if (/Test Case .+ failed \(/.test(tail)) reason ??= `Native test failed: ${tail.trim()}`
      }
      const finish = () =>
        reason || code !== 0
          ? reject(
              new Error(
                reason ??
                  `Native command failed (${termination ?? code}); see ${logPath ?? 'output'}.`,
              ),
            )
          : resolve({ code })
      if (log) log.end(finish)
      else finish()
    })
  })
}
