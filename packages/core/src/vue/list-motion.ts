import { markRaw, onScopeDispose } from '@vue/runtime-core'
import {
  createMotionRegion,
  type MotionLayoutOptions,
  type MotionPlayback,
} from '../experimental.js'
import { validateMotionLayoutChange, validateMotionLayoutOptions } from '../experimental-regions.js'

/** Shared Vue data changes; the host measures keyed direct children and Jolt owns playback. */
export function useMavisListMotion(options: MotionLayoutOptions = {}) {
  validateMotionLayoutOptions(options)
  const region = markRaw(createMotionRegion())
  const pending = new Set<MotionPlayback>()
  let disposed = false
  onScopeDispose(() => {
    disposed = true
    for (const playback of pending) playback.stop()
    pending.clear()
  })
  return {
    region,
    update(change: () => void): MotionPlayback {
      if (disposed) throw new Error('This list motion scope is disposed.')
      validateMotionLayoutChange(change)
      validateMotionLayoutOptions(options)
      if (!region.available) {
        const result = change() as unknown
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
          void Promise.resolve(result).catch(() => {})
          throw new TypeError('Layout motion needs a synchronous change callback.')
        }
        return { finished: Promise.resolve(false), stop() {} }
      }
      // Jolt captures the current visual pose before retiring earlier layout operations.
      // Do not stop the previous handle before this call; retain it only for scope teardown.
      const playback = region.animateLayout(change, options)
      if (disposed) {
        playback.stop()
        return playback
      }
      pending.add(playback)
      const forget = () => pending.delete(playback)
      void playback.finished.then(forget, forget)
      return playback
    },
  }
}
