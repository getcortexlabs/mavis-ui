import { expect, it, vi } from 'vitest'

const engine = vi.hoisted(() => {
  const mapped = { get: () => 2, dispose: vi.fn() }
  const input = { get: () => 1, dispose: vi.fn(), to: vi.fn(() => mapped) }
  const progress = { get: () => 0.5, dispose: vi.fn() }
  return { input, mapped, progress, stop: vi.fn() }
})
vi.mock('@rafaelaugusto/jolt', () => ({
  animate: vi.fn(),
  decay: vi.fn(),
  bind: vi.fn(),
  set: vi.fn(),
  drag: vi.fn(),
  pointerFollow: vi.fn(),
  springValue: vi.fn(),
  motionValue: () => engine.input,
  playbackProgress: () => engine.progress,
  stop: engine.stop,
}))
vi.mock('@rafaelaugusto/jolt/sensors', () => ({ sensor: vi.fn() }))
vi.mock('../packages/nativescript/src/native/scroll-motion.js', () => ({
  nativeScrollMotion: vi.fn(),
}))
vi.mock('../packages/nativescript/src/native/section-scroll.js', () => ({
  nativeSectionScroll: vi.fn(),
}))
vi.mock('../packages/nativescript/src/native/motion-region.js', () => ({
  assertNativeRegion: vi.fn(),
  nativeRegionTarget: vi.fn(),
}))
vi.mock('../packages/nativescript/src/native/visual-effects.js', () => ({
  nativeVisualEffects: () => ({}),
}))

import { nativeContinuousSurface } from '../packages/nativescript/src/native/motion-surface.js'

it('releases a mapped native value without disposing its borrowed input', () => {
  const { adapter } = nativeContinuousSurface({} as never, () => true)
  const input = adapter.motionValue!(1)
  const mapped = adapter.map!(input, [0, 1], [0, 2])
  mapped.dispose()
  expect(engine.mapped.dispose).toHaveBeenCalledOnce()
  expect(engine.input.dispose).not.toHaveBeenCalled()
  input.dispose()
  expect(engine.input.dispose).toHaveBeenCalledOnce()
  expect(engine.stop).not.toHaveBeenCalled()
})

it('releases a native progress derivation without stopping borrowed playback', () => {
  const { adapter } = nativeContinuousSurface({} as never, () => true)
  const playback = { finished: Promise.resolve(true), stop: vi.fn() }
  const progress = adapter.playbackProgress!(playback)
  expect(progress.get()).toBe(0.5)
  progress.dispose()
  expect(engine.progress.dispose).toHaveBeenCalledOnce()
  expect(playback.stop).not.toHaveBeenCalled()
  expect(engine.stop).not.toHaveBeenCalled()
})
