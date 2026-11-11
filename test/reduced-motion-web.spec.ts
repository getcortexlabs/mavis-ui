import { expect, it, vi } from 'vitest'
import { followReducedMotion } from '../packages/web/src/reduced-motion.js'
import type { WebMotionContext } from '../packages/web/src/motion-context.js'

function context() {
  let reduced = false
  const listeners = new Set<(value: boolean) => void>()
  const released = vi.fn()
  const runtime = {
    reducedMotion: vi.fn(() => reduced),
    onReducedMotion(listener: (value: boolean) => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  const value = {
    acquire: vi.fn(() => ({ runtime, release: released })),
  } as unknown as WebMotionContext
  return {
    value,
    runtime,
    released,
    listeners,
    change(next: boolean) {
      reduced = next
      for (const listener of [...listeners]) listener(next)
    },
  }
}

it('reads the runtime while observed and keeps the last value after release', () => {
  const host = context()
  const changed = vi.fn()
  const follow = followReducedMotion(host.value, {} as Document, changed)
  expect(follow.reduced).toBe(false)
  host.change(true)
  expect(changed).toHaveBeenCalledTimes(1)
  expect(follow.reduced).toBe(true)
  follow.release()
  follow.release()
  expect(host.released).toHaveBeenCalledTimes(1)
  expect(host.listeners.size).toBe(0)
  const reads = host.runtime.reducedMotion.mock.calls.length
  host.change(false)
  expect(changed).toHaveBeenCalledTimes(1)
  expect(follow.reduced).toBe(true)
  expect(host.runtime.reducedMotion).toHaveBeenCalledTimes(reads)
})
