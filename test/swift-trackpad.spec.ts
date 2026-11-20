import { expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir, availableParallelism, loadavg, freemem, totalmem } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
// @ts-expect-error The compiler ships source modules.
import { trackpadPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/trackpad.mjs'
// @ts-expect-error The compiler ships source modules.
import { swipeActionsPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/swipe-actions.mjs'

const run = promisify(execFile)
const read = (path: string) => {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch {
    return undefined
  }
}
const resources = () => ({
  load: loadavg(),
  freeBytes: freemem(),
  cpuPressure: read('/proc/pressure/cpu'),
  memoryPressure: read('/proc/pressure/memory'),
  cpuMax: read('/sys/fs/cgroup/cpu.max'),
  memoryEvents: read('/sys/fs/cgroup/memory.events'),
})
async function context(folder: string) {
  const cache = resolve(process.env.MAVIS_SWIFT_MODULE_CACHE ?? join(folder, 'module-cache'))
  mkdirSync(cache, { recursive: true })
  return {
    swift: (await run('swiftc', ['--version'], { timeout: 10_000 })).stdout.trim(),
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    workers: process.env.VITEST_MAX_THREADS,
    cpus: availableParallelism(),
    totalBytes: totalmem(),
    cache,
    cacheEntriesBefore: readdirSync(cache).length,
    before: resources(),
    compileMs: null as number | null,
    elapsedMs: 0,
  }
}

// Executed by the authorized full runner: no UI or synthetic desktop input. It compiles the
// actual generated policy, not a second JS implementation, and checks each sequence and edge.
it('applies native trackpad direction, axis locking, cancellation, momentum and paging bounds', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'mavis-trackpad-policy-'))
  const report = await context(folder)
  const started = performance.now()
  const samples: unknown[] = []
  const sample = setInterval(() => samples.push(resources()), 1000)
  try {
    writeFileSync(
      join(folder, 'main.swift'),
      `import Foundation
#if canImport(CoreGraphics)
import CoreGraphics
#endif
${trackpadPolicy}\n${swipeActionsPolicy}\n
func check(_ value: Bool, _ name: String) { precondition(value, name) }
var wheel = MavisTrackpadPolicy()
check(!wheel.update(x: 0, y: 2, phase: .began).consumed, "undecided")
check(!wheel.update(x: 1, y: 14, phase: .changed).consumed, "vertical scroll")
check(!wheel.update(x: 90, y: 0, phase: .changed).consumed, "vertical stays locked")
check(!wheel.update(x: 0, y: 0, phase: .ended).finished, "vertical end")
check(!wheel.update(x: 2, y: 0, phase: .began).consumed, "below threshold")
let horizontal = wheel.update(x: 5, y: 1, phase: .changed)
check(horizontal.consumed && horizontal.changed && horizontal.translation.width == 7, "horizontal progress")
let cancelled = wheel.update(x: 0, y: 0, phase: .cancelled)
check(cancelled.finished && cancelled.cancelled && !wheel.active, "cancel")
check(!wheel.update(x: 99, y: 0, phase: .changed, momentum: true).consumed, "no momentum after cancel")
_ = wheel.update(x: -50, y: 1, phase: .began)
let ended = wheel.update(x: -2, y: 0, phase: .ended)
check(ended.finished && ended.changed && ended.translation.width == -52, "final sample")
check(wheel.settlingMomentum, "page identity update keeps claimed momentum")
let momentum = wheel.update(x: -100, y: 0, phase: .changed, momentum: true)
check(momentum.consumed && !momentum.changed && !momentum.finished, "momentum never pages twice")
_ = wheel.update(x: 0, y: 0, phase: .ended, momentum: true)
check(!wheel.update(x: -12, y: 0, phase: .changed, momentum: true).consumed, "momentum released")
check(!wheel.update(x: -80, y: 0, phase: .began, precise: false).consumed, "ordinary wheel")
check(wheel.update(x: 0, y: -30, phase: .began, vertical: true).consumed, "zoomed viewer vertical pan")
check(wheel.cancel().cancelled && !wheel.active, "disable cancels")
check(mavisTrackpadPage(-41, index: 0, count: 3) == 1, "next")
check(mavisTrackpadPage(41, index: 0, count: 3) == nil, "first bound")
check(mavisTrackpadPage(-41, index: 2, count: 3) == nil, "last bound")
check(mavisTrackpadPage(41, index: 0, count: 3, loop: true) == 2, "loop")
check(mavisTrackpadPage(41, index: 0, count: 3, rtl: true) == 1, "rtl")
check(mavisTrackpadPage(-39, index: 0, count: 3) == nil, "short gesture")
check(mavisTrackpadPage(.infinity, index: 0, count: 3) == nil, "finite")
check(mavisSwipeDestination(100, 0, 200, 150, 1) == "start", "start actions")
check(mavisSwipeDestination(-100, 0, 200, 150, 1) == "end", "end actions")
check(mavisSwipeDestination(100, 0, 200, 150, -1) == "end", "rtl actions")
check(mavisSwipeDestination(20, 0, 200, 150, 1) == nil, "short swipe closes")
print("trackpad policy passed")
`,
    )
    await run('swiftc', ['-module-cache-path', report.cache, 'main.swift', '-o', 'policy'], {
      cwd: folder,
      timeout: 90_000,
    })
    report.compileMs = Math.round(performance.now() - started)
    expect((await run(join(folder, 'policy'), [], { timeout: 10_000 })).stdout.trim()).toBe(
      'trackpad policy passed',
    )
  } finally {
    clearInterval(sample)
    report.elapsedMs = Math.round(performance.now() - started)
    const result = { ...report, samples, after: resources() }
    console.log('Swift trackpad:', JSON.stringify(result))
    mkdirSync('artifacts/swift-trackpad', { recursive: true })
    writeFileSync(
      `artifacts/swift-trackpad/${Date.now()}.json`,
      JSON.stringify(result, null, 2) + '\n',
    )
    rmSync(folder, { recursive: true, force: true })
  }
}, 120_000)
