import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { View } from '@nativescript/core'
import { attachSegmentedIndicator } from '../packages/nativescript/src/native/segmented.js'
const state = vi.hoisted(() => ({
  reduced: false,
  events: new Map<string, Set<() => void>>(),
  reducedListeners: new Set<() => void>(),
  motions: [] as { stop: ReturnType<typeof vi.fn> }[],
  animate: vi.fn(),
  set: vi.fn(),
}))
vi.mock('@nativescript/core', () => ({
  Application: {
    suspended: false,
    suspendEvent: 'suspend',
    resumeEvent: 'resume',
    on(name: string, fn: () => void) {
      if (!state.events.has(name)) state.events.set(name, new Set())
      state.events.get(name)!.add(fn)
    },
    off(name: string, fn: () => void) {
      state.events.get(name)?.delete(fn)
    },
  },
}))
vi.mock('@rafaelaugusto/jolt', () => ({
  animate(...args: unknown[]) {
    state.animate(...args)
    const motion = { stop: vi.fn() }
    state.motions.push(motion)
    return motion
  },
  set: state.set,
  reducedMotion: () => state.reduced,
  onReducedMotion(fn: () => void) {
    state.reducedListeners.add(fn)
    return () => state.reducedListeners.delete(fn)
  },
}))
const dispose: (() => void)[] = []
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})
afterEach(() => {
  dispose.splice(0).forEach((fn) => fn())
  state.events.clear()
  state.reducedListeners.clear()
  state.motions.length = 0
  state.reduced = false
  vi.useRealTimers()
})
function setup() {
  const indicator = { opacity: 0, width: 1, height: 1 } as unknown as View
  let bounds: { key: string; x: number; width: number; height: number } | undefined = {
    key: 'a',
    x: 0,
    width: 100,
    height: 48,
  }
  const controller = attachSegmentedIndicator(indicator, () => bounds)
  dispose.push(controller.dispose)
  vi.runOnlyPendingTimers()
  return {
    indicator,
    controller,
    change(next: typeof bounds, animated = true) {
      bounds = next
      controller.update(animated)
      vi.runOnlyPendingTimers()
    },
  }
}
it('animates selection only, snaps resize and clears a missing selection', () => {
  const { indicator, change } = setup()
  expect(state.animate).not.toHaveBeenCalled()
  change({ key: 'b', x: 104, width: 100, height: 48 })
  expect(state.animate).toHaveBeenLastCalledWith(
    indicator,
    { x: 104 },
    { duration: 180, ease: 'easeOut' },
  )
  change({ key: 'b', x: 204, width: 200, height: 72 }, false)
  expect(state.motions[0]!.stop).toHaveBeenCalledOnce()
  expect(state.set).toHaveBeenLastCalledWith(indicator, { x: 204 })
  expect(indicator.height).toBe(72)
  change(undefined)
  expect(indicator.opacity).toBe(0)
  change({ key: 'a', x: 0, width: 200, height: 72 })
  expect(state.animate).toHaveBeenCalledOnce()
})
it('settles on suspend/reduced motion and removes listeners and pending work on dispose', () => {
  const { indicator, controller, change } = setup()
  change({ key: 'b', x: 104, width: 100, height: 48 })
  for (const fn of state.events.get('suspend')!) fn()
  expect(state.motions[0]!.stop).toHaveBeenCalledOnce()
  expect(state.set).toHaveBeenLastCalledWith(indicator, { x: 104 })
  change({ key: 'c', x: 208, width: 100, height: 48 })
  expect(state.animate).toHaveBeenCalledOnce()
  for (const fn of state.events.get('resume')!) fn()
  vi.runOnlyPendingTimers()
  state.reduced = true
  for (const fn of state.reducedListeners) fn()
  vi.runOnlyPendingTimers()
  change({ key: 'a', x: 0, width: 100, height: 48 })
  expect(state.animate).toHaveBeenCalledOnce()
  controller.update(true)
  controller.dispose()
  controller.dispose()
  const calls = state.set.mock.calls.length
  controller.update(true)
  vi.runOnlyPendingTimers()
  expect(state.set).toHaveBeenCalledTimes(calls)
  expect(state.reducedListeners.size).toBe(0)
  expect([...state.events.values()].every((listeners) => listeners.size === 0)).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})
it('does not animate zero-sized or non-finite measurements', () => {
  const { indicator, change } = setup()
  change({ key: 'b', x: NaN, width: 100, height: 48 })
  expect(indicator.opacity).toBe(0)
  change({ key: 'b', x: 0, width: 0, height: 48 })
  expect(indicator.opacity).toBe(0)
  expect(state.animate).not.toHaveBeenCalled()
})
