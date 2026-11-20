import { describe, expect, it } from 'vitest'
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
