import { expect, it, vi } from 'vitest'
import { bindMotionSurface, createMotionSurface } from '../packages/core/src/experimental.js'

function adapter() {
  const stops = vi.fn()
  let finish!: (value: boolean) => void
  const handle = {
    finished: new Promise<boolean>((resolve) => {
      finish = resolve
    }),
    stop() {
      stops()
      finish(false)
    },
  }
  return {
    animate: vi.fn(() => handle),
    set: vi.fn(() => handle),
    handle,
    finish: (value: boolean) => finish(value),
    stops,
  }
}

it('rejects calls before availability and invalidates old handles on replacement', async () => {
  const surface = createMotionSurface()
  expect(surface.available).toBe(false)
  expect(() => surface.animate({ scale: 1.1 })).toThrow(/unavailable/)
  const first = adapter()
  const release = bindMotionSurface(surface, first)
  const old = surface.animate({ scale: 1.2 })
  const settled = vi.fn()
  void old.finished.then(settled)
  const next = adapter()
  const remove = bindMotionSurface(surface, next)
  expect(await old.finished).toBe(false)
  old.stop()
  release()
  expect(surface.available).toBe(true)
  expect(first.stops).toHaveBeenCalledTimes(1)
  expect(next.stops).not.toHaveBeenCalled()
  expect(settled).toHaveBeenCalledTimes(1)
  const current = surface.animate({ scale: 1.3 })
  expect(next.animate).toHaveBeenCalledWith({ scale: 1.3 }, undefined)
  remove()
  remove()
  expect(await current.finished).toBe(false)
  expect(next.stops).toHaveBeenCalledTimes(1)
  expect(surface.available).toBe(false)
  expect(() => surface.set({ scale: 1 })).toThrow(/unavailable/)
})

it('does not stop completed playback during disposal', async () => {
  const surface = createMotionSurface()
  const binding = adapter()
  const remove = bindMotionSurface(surface, binding)
  const handle = surface.animate({ scale: 1.2 })
  binding.finish(true)
  expect(await handle.finished).toBe(true)
  remove()
  handle.stop()
  expect(binding.stops).not.toHaveBeenCalled()
})
