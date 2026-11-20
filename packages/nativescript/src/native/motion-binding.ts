import { Utils, isAndroid, type EventData, type View } from '@nativescript/core'
import { animate, set, onReducedMotion } from '@rafaelaugusto/jolt'
import {
  bindMotionSurface,
  motionChannels,
  motionKeyframes,
  type MotionFrames,
  type MotionSurface,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeContinuousSurface } from './motion-surface.js'
import { nativeMotionOwner } from './motion-owner.js'
import { takeShadow } from './moved-shadow.js'

export function createNativeMotionSurface(
  surface: () => MotionSurface | undefined,
  enabled: () => boolean = () => true,
  plainText: () => boolean = () => false,
  afterLayout = false,
  perspective?: () => number | undefined,
) {
  let view: View | undefined
  let unbind: (() => void) | undefined
  let offPreference: (() => void) | undefined
  let continuous: ReturnType<typeof nativeContinuousSurface> | undefined
  const active = new Map<ReturnType<typeof animate>, MotionFrames>()
  let layoutView: View | undefined
  let layoutQueued = false
  let flat: { view: View; perspective: number } | undefined
  const project = () => {
    const depth = perspective?.()
    if (flat && (depth === undefined || flat.view !== view)) {
      flat.view.perspective = flat.perspective
      flat = undefined
    }
    if (!view || depth === undefined || !unbind) return
    flat ??= { view, perspective: view.perspective }
    // Core multiplies by the density for Android's camera distance, whose unit is not the
    // CSS distance. This is the factor that draws the same projection as iOS and the Web.
    view.perspective = isAndroid ? depth * Utils.layout.getDisplayDensity() * Math.sqrt(5) : depth
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
            takeShadow(target, values)
            active.set(handle, values)
            void handle.finished.then(() => active.delete(handle))
            return handle
          },
          set: (values) => {
            continuous?.interrupt(Object.keys(values))
            const handle = animate(target, values, { duration: 0 })
            takeShadow(target, values)
            return handle
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
  return {
    refresh: bind,
    refreshEnabled: () => continuous?.refresh(),
    refreshPerspective: project,
    allowsActivation: () => continuous?.allowsActivation() ?? true,
    onLoaded(event: EventData) {
      view = event.object as View
      bind()
    },
    onUnloaded: unloaded,
  }
}
