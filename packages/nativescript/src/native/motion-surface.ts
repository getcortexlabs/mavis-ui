import { nativeScrollMotion } from './scroll-motion.js'
import { assertNativeRegion, nativeRegionTarget } from './motion-region.js'
import { nativeSectionScroll } from './section-scroll.js'
import { nativeVisualEffects } from './visual-effects.js'
import { sensor } from '@rafaelaugusto/jolt/sensors'
import type { View, EventData, TouchGestureEventData } from '@nativescript/core'
import {
  animate,
  decay,
  playbackProgress,
  bind,
  motionValue,
  springValue,
  set,
  stop,
  drag,
  pointerFollow,
  type DerivedValue,
  type PointerOptions,
} from '@rafaelaugusto/jolt'
import type {
  MotionSurfaceAdapter,
  MotionValueAdapter,
} from '@getcortexlabs/mavis-core/experimental'

export function nativeContinuousSurface(
  target: View,
  enabled: () => boolean,
  plainText: () => boolean = () => false,
) {
  const sources = new WeakMap<object, DerivedValue>()
  const colorSources = new WeakMap<object, import('@rafaelaugusto/jolt').DerivedColor>()
  const refreshes = new Set<() => void>()
  const scrolls = new Set<ReturnType<typeof nativeScrollMotion>>()
  const interrupt = (properties: readonly string[]) => {
    for (const scroll of scrolls) scroll.interrupt(properties)
  }
  let suppressUntil = 0
  const adapter: Pick<
    MotionSurfaceAdapter,
    | 'animateValue'
    | 'stopValue'
    | 'playbackProgress'
    | 'decay'
    | 'motionValue'
    | 'springValue'
    | 'bind'
    | 'drag'
    | 'map'
    | 'mapColor'
    | 'scalar'
    | 'readVelocity'
    | 'refresh'
    | 'scrollLinked'
    | 'scrollSection'
    | 'pointerFollow'
    | 'sensor'
  > &
    import('@getcortexlabs/mavis-core/experimental').MotionVisualAdapter = {
    ...nativeVisualEffects(target, sources, colorSources, plainText),
    sensor(kind, options) {
      const input = sensor(kind, options)
      const wrap = (source: DerivedValue) => {
        const value = { get: () => source.get(), dispose() {} }
        sources.set(value, source)
        return value
      }
      return {
        kind,
        x: wrap(input.x),
        y: wrap(input.y),
        z: wrap(input.z),
        quaternion:
          input.kind === 'rotation'
            ? {
                x: wrap(input.quaternion.x),
                y: wrap(input.quaternion.y),
                z: wrap(input.quaternion.z),
                w: wrap(input.quaternion.w),
              }
            : undefined,
        get status() {
          return input.status
        },
        get available() {
          return input.available
        },
        get paused() {
          return input.paused
        },
        pause: () => input.pause(),
        resume: () => input.play(),
        recenter: () => {
          if (input.kind === 'rotation') input.recenter()
        },
        requestPermission: async () => 'not-required' as const,
        snapshot: () => ({ ...input.snapshot(), backend: 'native' as const }),
        dispose: () => input.dispose(),
      }
    },
    pointerFollow(region, options) {
      assertNativeRegion(region, target)
      // Jolt owns the hover listener, its geometry, suspension and the views' load state.
      // Ordinary touch is not hover, so scrolling, taps and focus stay with the app.
      const pointer = pointerFollow(nativeRegionTarget(region), {
        ...options,
        disabled: options.disabled || !enabled(),
      } as PointerOptions)
      let disabled = options.disabled ?? false
      const refresh = () => pointer.update({ disabled: disabled || !enabled() })
      refreshes.add(refresh)
      // The pointer owns its values; wrappers are borrowed by Mavis bindings.
      const wrap = (source: DerivedValue) => {
        const value = { get: () => source.get(), dispose() {} }
        sources.set(value, source)
        return value
      }
      return {
        x: wrap(pointer.x),
        y: wrap(pointer.y),
        presence: wrap(pointer.presence),
        get execution() {
          return pointer.available ? ('hover' as const) : ('static' as const)
        },
        get available() {
          return pointer.available
        },
        get active() {
          return pointer.active
        },
        update(state) {
          disabled = state.disabled
          refresh()
        },
        refresh: () => pointer.refresh(),
        dispose() {
          refreshes.delete(refresh)
          pointer.dispose()
        },
      }
    },
    scrollSection(source, section, frames, options) {
      interrupt(Object.keys(frames))
      const scroll = nativeSectionScroll(
        source,
        nativeRegionTarget(section),
        target,
        frames,
        options,
      )
      scrolls.add(scroll)
      return {
        get execution() {
          return scroll.execution
        },
        refresh: () => scroll.refresh(),
        dispose() {
          scrolls.delete(scroll)
          scroll.dispose()
        },
      }
    },
    scrollLinked(source, frames, options) {
      interrupt(Object.keys(frames))
      const scroll = nativeScrollMotion(source, target, frames, options)
      scrolls.add(scroll)
      return {
        get execution() {
          return scroll.execution
        },
        refresh: () => scroll.refresh(),
        dispose() {
          scrolls.delete(scroll)
          scroll.dispose()
        },
      }
    },
    // Native views keep their fractional pivot through layout; no surface recreation.
    refresh: () => target.requestLayout(),
    map(source, input, output, options) {
      const mapped = sources.get(source)!.to(input, output, options)
      const value = { get: () => mapped.get(), dispose: () => mapped.dispose() }
      sources.set(value, mapped)
      return value
    },
    scalar(source, operation, operand, maximum) {
      const input = sources.get(source)!
      let result: DerivedValue
      if (operation === 'clamp') result = input.clamp(operand as number, maximum!)
      else if (
        operation === 'abs' ||
        operation === 'sin' ||
        operation === 'cos' ||
        operation === 'velocity'
      )
        result = input[operation]()
      else result = input[operation](typeof operand === 'number' ? operand : sources.get(operand!)!)
      const value = { get: () => result.get(), dispose: () => result.dispose() }
      sources.set(value, result)
      return value
    },
    readVelocity: (source) => sources.get(source)!.getVelocity(),
    mapColor(source, input, output) {
      const mapped = sources.get(source)!.to(input, output)
      const value = { get: () => mapped.get().hex, dispose() {} }
      colorSources.set(value, mapped)
      return value
    },
    animateValue(value, frames, options) {
      const source = sources.get(value)
      if (!source) throw new TypeError('Use a mutable native motion value.')
      return animate(source as ReturnType<typeof motionValue>, frames, options)
    },
    stopValue(value, options) {
      const source = sources.get(value)
      if (!source) throw new TypeError('Use a native motion value.')
      stop(source as ReturnType<typeof motionValue>, options)
    },
    playbackProgress(handle) {
      const progress = playbackProgress(handle as Parameters<typeof playbackProgress>[0])
      const value = { get: () => progress.get(), dispose: () => progress.dispose() }
      sources.set(value, progress)
      return value
    },
    decay(velocity, options) {
      interrupt(Object.keys(velocity))
      return decay(target, velocity, options)
    },
    motionValue(initial) {
      const source = motionValue(initial)
      const value: MotionValueAdapter = {
        get: () => source.get(),
        set: (value) => set(source, value),
        dispose: () => source.dispose(),
      }
      sources.set(value, source)
      return value
    },
    springValue(input, options) {
      const spring = springValue(sources.get(input)!, options)
      const value = {
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
      sources.set(value, spring)
      return value
    },
    bind(values) {
      interrupt(Object.keys(values))
      const dispose = bind(
        target,
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [
            key,
            colorSources.get(value) ?? sources.get(value)!,
          ]),
        ),
      )
      return { dispose }
    },
    drag(options) {
      let paused = false
      const gesture = drag(target, {
        ...options,
        onMove: () => {
          suppressUntil = Date.now() + 500
        },
        onRelease: (event) => {
          suppressUntil = Date.now() + 500
          options.onRelease?.(event)
        },
      })
      const refresh = () => (paused || !enabled() ? gesture.pause() : gesture.play())
      refreshes.add(refresh)
      refresh()
      const touch = (event: EventData) => {
        if ((event as TouchGestureEventData).action === 'down') suppressUntil = 0
      }
      target.on('touch', touch)
      return {
        get dragging() {
          return gesture.dragging
        },
        pause() {
          paused = true
          refresh()
        },
        resume() {
          paused = false
          refresh()
        },
        cancel: () => gesture.cancel(),
        dispose() {
          refreshes.delete(refresh)
          target.off('touch', touch)
          gesture.dispose()
        },
      }
    },
  }
  return {
    adapter,
    interrupt,
    refresh() {
      for (const refresh of refreshes) refresh()
    },
    allowsActivation: () => Date.now() >= suppressUntil,
  }
}
