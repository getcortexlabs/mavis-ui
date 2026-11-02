import type { EventData, View } from '@nativescript/core'
import { onBeforeUnmount, watch } from 'nativescript-vue'
import { animate, set, onReducedMotion } from '@rafaelaugusto/jolt'
import {
  bindMotionSurface,
  type MotionFrames,
  type MotionSurface,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeContinuousSurface } from '../native/motion-surface.js'

export function useMotionSurface(
  surface: () => MotionSurface | undefined,
  enabled: () => boolean = () => true,
) {
  let view: View | undefined
  let unbind: (() => void) | undefined
  let offPreference: (() => void) | undefined
  let continuous: ReturnType<typeof nativeContinuousSurface> | undefined
  const active = new Map<ReturnType<typeof animate>, MotionFrames>()
  const release = () => {
    unbind?.()
    unbind = undefined
    continuous = undefined
    offPreference?.()
    offPreference = undefined
    for (const handle of active.keys()) handle.stop()
    active.clear()
  }
  const bind = () => {
    release()
    const target = view
    const reference = surface()
    if (!target || !reference) return
    continuous = nativeContinuousSurface(target, enabled)
    unbind = bindMotionSurface(reference, {
      ...continuous.adapter,
      animate(values, options) {
        continuous?.interrupt(Object.keys(values))
        const handle = animate(target, values, options)
        active.set(handle, values)
        void handle.finished.then(() => active.delete(handle))
        return handle
      },
      set: (values) => {
        continuous?.interrupt(Object.keys(values))
        return animate(target, values, { duration: 0 })
      },
    })
    offPreference = onReducedMotion((reduced) => {
      if (!reduced) return
      // Set only spatial channels: opacity can keep its existing timeline.
      const values: Record<string, number> = {}
      for (const frames of active.values())
        for (const [property, value] of Object.entries(frames)) {
          if (property === 'opacity') continue
          const final = Array.isArray(value) ? value.at(-1) : value
          if (typeof final === 'number') values[property] = final
        }
      if (Object.keys(values).length) set(target, values)
    })
  }
  const unloaded = () => {
    release()
    view = undefined
  }
  watch(surface, bind, { flush: 'post' })
  watch(enabled, () => continuous?.refresh(), { flush: 'sync' })
  onBeforeUnmount(unloaded)
  return {
    allowsActivation: () => continuous?.allowsActivation() ?? true,
    onLoaded(event: EventData) {
      view = event.object as View
      bind()
    },
    onUnloaded: unloaded,
  }
}
