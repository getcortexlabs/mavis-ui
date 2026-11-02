import { webScrollElement } from './scroll-motion.js'
import type {
  WebReadableValue,
  WebRuntime,
  WebMotionScope,
  WebMotionValue,
} from '@rafaelaugusto/jolt/web'
import type { MotionSurfaceAdapter } from '@getcortexlabs/mavis-core/experimental'
import { webRegion } from './motion-region.js'

const boundPaint = new WeakMap<HTMLElement, Map<string, number>>()
const paintKeys = new Set([
  'backgroundColor',
  'borderColor',
  'color',
  'borderRadius',
  'borderWidth',
])
/** Vue may rerender slots while an application value owns paint on this element. */
export function preserveBoundPaint(target: HTMLElement | undefined) {
  return target
    ? Object.fromEntries(
        [...(boundPaint.get(target)?.keys() ?? [])].map((key) => [
          key,
          target.style[key as 'backgroundColor'],
        ]),
      )
    : {}
}

const targets = new WeakMap<MotionSurfaceAdapter, { runtime: WebRuntime; target: HTMLElement }>()
export function webSurfaceTarget(adapter: MotionSurfaceAdapter) {
  const target = targets.get(adapter)
  if (!target) throw new TypeError('Use a Web motion surface.')
  return target
}

/** Application motion uses the same Jolt context as this component's press layer. */
export function webMotionSurface(
  runtime: WebRuntime,
  target: HTMLElement,
  enabled: () => boolean,
  owner: WebRuntime | WebMotionScope = runtime,
  sources = new WeakMap<object, WebReadableValue>(),
  refreshes = new Map<object, () => void>(),
) {
  const adapter: MotionSurfaceAdapter = {
    use(setup) {
      const scope = runtime.scope()
      try {
        scope.use((child) =>
          setup(webMotionSurface(runtime, target, enabled, child, sources, refreshes).adapter),
        )
      } catch (error) {
        scope.dispose()
        throw error
      }
      return () => scope.dispose()
    },
    pointerFollow(region, options) {
      const input = webRegion(region)
      if (input.runtime !== runtime || input.target === target || !input.target.contains(target))
        throw new TypeError('Use a separate enclosing motion region for pointer input.')
      const pointer = owner.pointerFollow(input.target, {
        ...options,
        disabled: options.disabled || !enabled(),
      })
      let disabled = options.disabled ?? false
      const refresh = () => pointer.update({ disabled: disabled || !enabled() })
      refreshes.set(pointer, refresh)
      // The pointer owns its values; wrappers are borrowed by Mavis bindings.
      const wrap = (value: WebReadableValue) => {
        const borrowed = { get: () => value.get(), dispose() {} }
        sources.set(borrowed, value)
        return borrowed
      }
      return {
        x: wrap(pointer.x),
        y: wrap(pointer.y),
        execution: 'hover',
        get active() {
          return pointer.active
        },
        update(state) {
          disabled = state.disabled
          refresh()
        },
        refresh: () => pointer.refresh(),
        dispose() {
          refreshes.delete(pointer)
          pointer.dispose()
        },
      }
    },
    refresh: () => runtime.refresh(target),
    scrollLinked: (source, frames, options) =>
      owner.scrollLinked(webScrollElement(source), target, frames, options),
    map(source, input, output, options) {
      const value = sources.get(source) ?? (source as WebReadableValue)
      return 'map' in owner
        ? owner.map(value, input, output, options)
        : value.to(input, output, options)
    },
    mapColor(source, input, output) {
      const value = sources.get(source) ?? (source as WebReadableValue)
      return 'map' in owner ? owner.map(value, input, output) : value.to(input, output)
    },
    springValue(source, options) {
      // Keep the runtime's private value identity; it rejects values from other contexts.
      const spring = owner.springValue(source as ReturnType<WebRuntime['motionValue']>, options)
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

    animateValue: (value, frames, options) =>
      owner.animate(value as WebMotionValue, frames, options),
    stopValue: (value, options) => runtime.stop(value as WebMotionValue, options),
    playbackProgress: (handle) =>
      owner.playbackProgress(handle as Parameters<WebRuntime['playbackProgress']>[0]),
    decay: (velocity, options) => owner.decay(target, velocity, options),
    animate: (values, options) => owner.animate(target, values, options),
    set: (values) => owner.set(target, values),
    motionValue: (initial) => owner.motionValue(initial),
    bind(values) {
      // Spring wrappers retain their public handle, rather than registering a second clock.
      const binding = owner.bind(
        target,
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, sources.get(value) ?? value]),
        ) as Parameters<WebRuntime['bind']>[1],
      )
      let counts = boundPaint.get(target)
      if (!counts) boundPaint.set(target, (counts = new Map()))
      const keys = Object.keys(values).filter((key) => paintKeys.has(key))
      for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
      let disposed = false
      return {
        dispose() {
          if (disposed) return
          disposed = true
          try {
            binding.dispose()
          } finally {
            for (const key of keys) {
              const count = counts!.get(key)! - 1
              if (count) counts!.set(key, count)
              else counts!.delete(key)
            }
            if (!counts!.size) boundPaint.delete(target)
          }
        },
      }
    },
    drag(options) {
      const drag = owner.drag(target, {
        ...options,
        disabled: !enabled(),
        onRelease: options.onRelease
          ? (event) =>
              options.onRelease!({
                x: event.x,
                y: event.y,
                velocityX: event.velocity.x,
                velocityY: event.velocity.y,
              })
          : undefined,
      })
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
  targets.set(adapter, { runtime, target })
  return {
    adapter,
    refresh: () => {
      for (const refresh of refreshes.values()) refresh()
    },
  }
}
