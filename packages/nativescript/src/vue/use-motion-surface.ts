import type { EventData, View } from '@nativescript/core'
import { inject, onBeforeUnmount, watch } from 'nativescript-vue'
import { animate, set, onReducedMotion } from '@rafaelaugusto/jolt'
import {
  bindMotionSurface,
  motionChannels,
  motionKeyframes,
  type MotionFrames,
  type MotionSurface,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeContinuousSurface } from '../native/motion-surface.js'
import { nativeMotionOwner } from '../native/motion-owner.js'
import { perspectiveKey } from './perspective.js'

export function useMotionSurface(
  surface: () => MotionSurface | undefined,
  enabled: () => boolean = () => true,
  plainText: () => boolean = () => false,
  afterLayout = false,
) {
  let view: View | undefined
  let unbind: (() => void) | undefined
  let offPreference: (() => void) | undefined
  let continuous: ReturnType<typeof nativeContinuousSurface> | undefined
  const active = new Map<ReturnType<typeof animate>, MotionFrames>()
  let layoutView: View | undefined
  let layoutQueued = false
  const perspective = inject(perspectiveKey, undefined)
  let flat: { view: View; perspective: number } | undefined
  const project = () => {
    const depth = perspective?.()
    if (flat && (depth === undefined || flat.view !== view)) {
      flat.view.perspective = flat.perspective
      flat = undefined
    }
    if (!view || depth === undefined || !unbind) return
    flat ??= { view, perspective: view.perspective }
    view.perspective = depth
  }
  const clearLayout = () => {
    layoutView?.off('layoutChanged', laidOut)
    layoutView = undefined
  }
  const release = () => {
    unbind?.()
    unbind = undefined
    continuous = undefined
    offPreference?.()
    offPreference = undefined
    for (const handle of active.keys()) handle.stop()
    active.clear()
    project()
  }
  const bind = () => {
    release()
    const target = view
    const reference = surface()
    if (!target || !reference) return
    if (
      afterLayout &&
      (!target.isLayoutValid ||
        target.getActualSize().width <= 0 ||
        target.getActualSize().height <= 0)
    ) {
      if (layoutView !== target) {
        clearLayout()
        layoutView = target
        target.on('layoutChanged', laidOut)
      }
      return
    }
    clearLayout()
    continuous = nativeContinuousSurface(target, enabled, plainText)
    unbind = bindMotionSurface(
      reference,
      nativeMotionOwner(
        {
          ...continuous.adapter,
          animate(values, options) {
            continuous?.interrupt(motionChannels(values))
            const handle = animate(target, motionKeyframes(values), options)
            active.set(handle, values)
            void handle.finished.then(() => active.delete(handle))
            return handle
          },
          set: (values) => {
            continuous?.interrupt(Object.keys(values))
            return animate(target, values, { duration: 0 })
          },
        },
        target,
      ),
    )
    project()
    offPreference = onReducedMotion((reduced) => {
      if (!reduced) return
      // Set only spatial channels: opacity and shadow paint can keep their timelines.
      const values: Record<string, number> = {}
      for (const frames of active.values()) {
        if (frames.path)
          Object.assign(values, {
            x: frames.path.end.x,
            y: frames.path.end.y,
            ...(frames.orient ? { rotate: frames.path.end.rotate } : {}),
          })
        for (const [property, value] of Object.entries(frames)) {
          if (property === 'opacity' || property.startsWith('shadow')) continue
          const final = Array.isArray(value) ? value.at(-1) : value
          if (typeof final === 'number') values[property] = final
        }
      }
      if (Object.keys(values).length) set(target, values)
    })
  }
  const laidOut = () => {
    if (layoutQueued) return
    layoutQueued = true
    void Promise.resolve().then(() => {
      layoutQueued = false
      if (view) bind()
    })
  }
  const unloaded = () => {
    clearLayout()
    release()
    view = undefined
  }
  watch(surface, bind, { flush: 'post' })
  if (perspective) watch(perspective, project, { flush: 'post' })
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
