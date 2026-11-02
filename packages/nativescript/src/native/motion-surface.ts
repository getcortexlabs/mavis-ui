import { nativeScrollMotion } from './scroll-motion.js'
import { assertNativeRegion } from './motion-region.js'
import type { View, EventData, TouchGestureEventData } from '@nativescript/core'
import {
  bind,
  motionValue,
  springValue,
  set,
  stop,
  drag,
  type DerivedValue,
} from '@rafaelaugusto/jolt'
import type {
  MotionSurfaceAdapter,
  MotionValueAdapter,
} from '@getcortexlabs/mavis-core/experimental'

export function nativeContinuousSurface(target: View, enabled: () => boolean) {
  const sources = new WeakMap<object, DerivedValue>()
  const refreshes = new Set<() => void>()
  const scrolls = new Set<ReturnType<typeof nativeScrollMotion>>()
  const interrupt = (properties: readonly string[]) => {
    for (const scroll of scrolls) scroll.interrupt(properties)
  }
  let suppressUntil = 0
  const adapter: Pick<
    MotionSurfaceAdapter,
    | 'motionValue'
    | 'springValue'
    | 'bind'
    | 'drag'
    | 'map'
    | 'refresh'
    | 'scrollLinked'
    | 'pointerFollow'
  > = {
    pointerFollow(region, options) {
      assertNativeRegion(region, target)
      const x = adapter.motionValue!(options.rest?.x ?? 0)
      const y = adapter.motionValue!(options.rest?.y ?? 0)
      return {
        x,
        y,
        execution: 'static',
        active: false,
        update() {},
        refresh() {},
        dispose() {
          x.dispose()
          y.dispose()
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
      const value = { get: () => mapped.get(), dispose() {} }
      sources.set(value, mapped)
      return value
    },
    motionValue(initial) {
      const source = motionValue(initial)
      const value: MotionValueAdapter = {
        get: () => source.get(),
        set: (value) => set(source, value),
        dispose: () => stop(source),
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
          Object.entries(values).map(([key, value]) => [key, sources.get(value)!]),
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
        onRelease: () => {
          suppressUntil = Date.now() + 500
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
