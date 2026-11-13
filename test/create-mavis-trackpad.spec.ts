import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
// @ts-expect-error The compiler ships source modules.
import { trackpadPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/trackpad.mjs'
// @ts-expect-error The compiler ships source modules.
import { swipeActionsPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/swipe-actions.mjs'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships source modules.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const fixture = async (name: string, root: string) =>
  compileProject(await readShared(new URL(`./portable/${name}`, import.meta.url).pathname), {
    root,
  })

describe('Mac trackpad ownership and Jolt components', () => {
  it.each([
    ['carousel', 'Stories'],
    ['viewer', 'Photos'],
    ['swipe', 'Mail'],
  ])(
    'keeps %s models in both source formats and emits one scoped input bridge',
    async (name, root) => {
      const tsx = await fixture(name!, root!),
        vue = await fixture(`${name}Vue`, root!)
      const normalize = (source: string) =>
        source
          .split('\n')
          .slice(1)
          .join('\n')
          .replace(
            /onClose: \{ \(reason: String\) in\n(\s+)self.reason = reason/g,
            'onClose: { (value: String) in\n$1self.reason = value',
          )
      expect(normalize(vue.swift.get(`${root}.swift`))).toBe(
        normalize(tsx.swift.get(`${root}.swift`)),
      )
      const runtime = tsx.swift.get('MavisControls.swift')
      expect(runtime.match(/private struct MavisTrackpadInput:/g)).toHaveLength(1)
      expect(runtime.includes('event.window === window')).toBe(true)
      expect(
        runtime.includes('visibleRect.contains(convert(event.locationInWindow, from: nil))'),
      ).toBe(true)
      expect(runtime.includes('guard sequenceStartedHere else { return event }')).toBe(true)
      expect(runtime.includes('return sample.consumed ? nil : event')).toBe(true)
      expect(runtime.includes('NSEvent.removeMonitor(monitor)')).toBe(true)
      expect(runtime.includes('changed && !policy.settlingMomentum')).toBe(true)
      expect(runtime.includes('cancellationPending = false\n            input?.end(true)')).toBe(
        true,
      )
      expect(runtime).not.toContain('self?.receive(event) ?? event')
    },
  )
  it('settles and cancels through existing Jolt owners rather than introducing an animation clock', async () => {
    const runtime = (await fixture('carousel', 'Stories')).swift.get('MavisControls.swift')
    expect(
      /drag(?:\.model)?\.update\(translation: CGSize\(width: translation.width, height: 0\)\)/.test(
        runtime,
      ),
    ).toBe(true)
    expect(runtime.includes('guard before, !after, !trackpadSequence')).toBe(true)
    expect(runtime.includes('if cancelled { synchronize() } else { select(next) }')).toBe(true)
    expect(runtime.includes('try? motion.settle(to: trackpadOrigin, reducedMotion: still)')).toBe(
      true,
    )
    expect(runtime.includes('vertical: scale > 1.001')).toBe(true)
    const bridge = runtime.slice(
      runtime.indexOf('private struct MavisTrackpadInput:'),
      runtime.indexOf('func mavisTrackpad(enabled:'),
    )
    expect(bridge).not.toMatch(/Timer|asyncAfter|displayLink|JoltMotionValue/)
  })
})

// Executed by the authorized full runner: no UI or synthetic desktop input. It compiles the
// actual generated policy, not a second JS implementation, and checks each sequence and edge.
it('applies native trackpad direction, axis locking, cancellation, momentum and paging bounds', () => {
  const folder = mkdtempSync(join(tmpdir(), 'mavis-trackpad-policy-'))
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
    execFileSync('swiftc', ['main.swift', '-o', 'policy'], { cwd: folder })
    expect(execFileSync(join(folder, 'policy'), { encoding: 'utf8' }).trim()).toBe(
      'trackpad policy passed',
    )
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})
