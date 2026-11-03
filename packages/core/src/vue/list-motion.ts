import { markRaw, onScopeDispose } from '@vue/runtime-core'
import {
  createMotionRegion,
  type MotionLayoutOptions,
  type MotionPlayback,
} from '../experimental.js'

/** Shared Vue data changes; the host measures keyed direct children and Jolt owns playback. */
export function useMavisListMotion(options: MotionLayoutOptions = {}) {
  const region = markRaw(createMotionRegion())
  let active: MotionPlayback | undefined
  let disposed = false
  onScopeDispose(() => {
    disposed = true
    active?.stop()
  })
  return {
    region,
    update(change: () => void): MotionPlayback {
      if (disposed) throw new Error('This list motion scope is disposed.')
      if (typeof change !== 'function')
        throw new TypeError('List motion needs a synchronous data change.')
      if (!region.available) {
        change()
        return { finished: Promise.resolve(false), stop() {} }
      }
      active = region.animateLayout(change, options)
      return active
    },
  }
}
