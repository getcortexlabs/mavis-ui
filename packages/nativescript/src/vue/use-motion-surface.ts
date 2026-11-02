import type { EventData, View } from '@nativescript/core'
import { onBeforeUnmount, watch } from 'nativescript-vue'
import { animate, set, onReducedMotion } from '@rafaelaugusto/jolt'
import {
  bindMotionSurface,
  type MotionFrames,
  type MotionSurface,
} from '@getcortexlabs/mavis-core/experimental'

export function useMotionSurface(surface: () => MotionSurface | undefined) {
  let view: View | undefined
  let unbind: (() => void) | undefined
  let offPreference: (() => void) | undefined
  const active = new Map<ReturnType<typeof animate>, MotionFrames>()
  const release = () => {
    unbind?.()
    unbind = undefined
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
    unbind = bindMotionSurface(reference, {
      animate(values, options) {
        const handle = animate(target, values, options)
        active.set(handle, values)
        void handle.finished.then(() => active.delete(handle))
        return handle
      },
      set: (values) => animate(target, values, { duration: 0 }),
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
  onBeforeUnmount(unloaded)
  return {
    onLoaded(event: EventData) {
      view = event.object as View
      bind()
    },
    onUnloaded: unloaded,
  }
}
