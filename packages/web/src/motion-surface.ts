import { webScrollElement } from './scroll-motion.js'
import type { WebReadableValue, WebRuntime } from '@rafaelaugusto/jolt/web'
import type { MotionSurfaceAdapter } from '@getcortexlabs/mavis-core/experimental'

/** Application motion uses the same Jolt context as this component's press layer. */
export function webMotionSurface(runtime: WebRuntime, target: HTMLElement, enabled: () => boolean) {
  const sources = new WeakMap<object, WebReadableValue>()
  const refreshes = new Map<object, () => void>()
  const adapter: MotionSurfaceAdapter = {
    refresh: () => runtime.refresh(target),
    scrollLinked: (source, frames, options) =>
      runtime.scrollLinked(webScrollElement(source), target, frames, options),
    map(source, input, output, options) {
      return (sources.get(source) ?? (source as WebReadableValue)).to(input, output, options)
    },
    springValue(source, options) {
      // Keep the runtime's private value identity; it rejects values from other contexts.
      const spring = runtime.springValue(source as ReturnType<WebRuntime['motionValue']>, options)
      const wrapper = {
        get: () => spring.get(),
        getVelocity: () => spring.getVelocity(),
        get moving() {
          return spring.moving
        },
        get paused() {
          return spring.paused
        },
        pause: () => spring.pause(),
        resume: () => spring.play(),
        dispose: () => spring.dispose(),
      }
      sources.set(wrapper, spring)
      return wrapper
    },

    animate: (values, options) => runtime.animate(target, values, options),
    set: (values) => runtime.set(target, values),
    motionValue: (initial) => runtime.motionValue(initial),
    bind(values) {
      // Spring wrappers retain their public handle, rather than registering a second clock.
      return runtime.bind(
        target,
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, sources.get(value) ?? value]),
        ) as Partial<Record<keyof typeof values, WebReadableValue>>,
      )
    },
    drag(options) {
      const drag = runtime.drag(target, { ...options, disabled: !enabled() })
      let paused = false
      const refresh = () => {
        const disabled = paused || !enabled()
        drag.update({ disabled })
        if (disabled) drag.animation?.stop()
      }
      refreshes.set(drag, refresh)
      return {
        get dragging() {
          return drag.dragging
        },
        pause() {
          paused = true
          refresh()
        },
        resume() {
          paused = false
          refresh()
        },
        cancel() {
          drag.cancel()
          drag.animation?.stop()
        },
        dispose() {
          refreshes.delete(drag)
          drag.dispose()
        },
      }
    },
  }
  return {
    adapter,
    refresh: () => {
      for (const refresh of refreshes.values()) refresh()
    },
  }
}
