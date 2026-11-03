import { Application, ScrollView, type View } from '@nativescript/core'
import {
  animate,
  animateLayout,
  motionScope,
  reducedMotion,
  onReducedMotion,
} from '@rafaelaugusto/jolt'
import { sharedLayout } from '@rafaelaugusto/jolt/shared-layout'
import {
  bindMotionRegion,
  type MotionRegion,
  type MotionRegionAdapter,
  type MotionSurfaceAdapter,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeScrollElement } from './scroll-motion.js'
import { nativeCollectionMotion } from './collection-motion.js'
import { nativePlatformMotion } from './platform-motion.js'

const targets = new WeakMap<MotionSurfaceAdapter, View>()
const regions = new WeakMap<MotionRegionAdapter, View>()
export function nativeRegionTarget(adapter: MotionRegionAdapter) {
  const target = regions.get(adapter)
  if (!target?.isLoaded) throw new Error('Use a loaded native motion region.')
  return target
}
export function assertNativeRegion(adapter: MotionRegionAdapter, target: View) {
  const region = regions.get(adapter)
  if (!region || region === target || !inside(target, region))
    throw new TypeError('Use a separate enclosing native motion region.')
}
export function registerNativeSurface(adapter: MotionSurfaceAdapter, target: View) {
  targets.set(adapter, target)
}
function resolve(adapter: MotionSurfaceAdapter) {
  const target = targets.get(adapter)
  if (!target?.isLoaded) throw new Error('Use a loaded native motion surface.')
  return target
}
function inside(view: View, container: View) {
  for (let current: View | undefined = view; current; current = current.parent as View | undefined)
    if (current === container) return true
  return false
}

/** Native observation is event-driven geometry; Jolt remains the only playback clock. */
function viewportEnter(
  container: View,
  surfaces: readonly MotionSurfaceAdapter[],
  options: Parameters<MotionRegionAdapter['viewportEnter']>[1],
) {
  const targets = surfaces.map(resolve)
  let root: View = options.root ? nativeScrollElement(options.root) : container
  if (!options.root) {
    for (
      let parent = container.parent as View | undefined;
      parent;
      parent = parent.parent as View | undefined
    )
      if (parent instanceof ScrollView) {
        root = parent
        break
      }
  }
  const states = targets.map((target, index) => ({
    target,
    index,
    visible: false,
    completed: false,
    animation: undefined as ReturnType<typeof animate> | undefined,
  }))
  let disposed = false,
    disabled = options.disabled ?? false,
    observing = false
  const stop = (state: (typeof states)[number]) => {
    const handle = state.animation
    state.animation = undefined
    if (handle) {
      handle.progress = 1
      handle.stop()
    }
  }
  const detach = () => {
    if (!observing) return
    observing = false
    root.off('scroll', refresh)
    root.off('layoutChanged', refresh)
    for (const state of states) state.target.off('layoutChanged', refresh)
  }
  const refresh = () => {
    if (disposed || disabled || Application.suspended || reducedMotion()) {
      for (const state of states) {
        stop(state)
        state.visible = false
      }
      return
    }
    const size = root.getActualSize(),
      margin = options.margin ?? 0
    for (const state of states) {
      if (!state.target.isLoaded || (options.once !== false && state.completed)) continue
      const point = state.target.getLocationRelativeTo(root),
        bounds = state.target.getActualSize()
      const area = bounds.width * bounds.height
      const overlap = point
        ? Math.max(
            0,
            Math.min(point.x + bounds.width, size.width + margin) - Math.max(point.x, -margin),
          ) *
          Math.max(
            0,
            Math.min(point.y + bounds.height, size.height + margin) - Math.max(point.y, -margin),
          )
        : 0
      const visible = area > 0 && overlap > 0 && overlap / area >= (options.threshold ?? 0)
      if (!visible) stop(state)
      if (visible && !state.visible && !state.animation) {
        const animation = animate(state.target, options.frames ?? { opacity: [0, 1], y: [20, 0] }, {
          ...(options.transition?.type === 'gravity'
            ? options.transition
            : { duration: 450, ...options.transition }),
          delay: (options.transition?.delay ?? 0) + state.index * (options.stagger ?? 70),
        })
        state.animation = animation
        void animation.finished.then((completed) => {
          if (disposed || state.animation !== animation) return
          state.animation = undefined
          if (completed) state.completed = true
          if (
            options.once !== false &&
            states.every((entry) => entry.completed || !entry.target.isLoaded)
          )
            detach()
        })
      }
      state.visible = visible
    }
  }
  const attach = () => {
    if (
      observing ||
      disposed ||
      disabled ||
      (options.once !== false && states.every((state) => state.completed))
    )
      return
    observing = true
    root.on('scroll', refresh)
    root.on('layoutChanged', refresh)
    for (const state of states) state.target.on('layoutChanged', refresh)
  }
  const preference = onReducedMotion(() => {
    attach()
    refresh()
  })
  Application.on(Application.suspendEvent, refresh)
  Application.on(Application.resumeEvent, refresh)
  attach()
  refresh()
  return {
    execution: 'native-layout' as const,
    get pending() {
      return states.filter((state) => state.animation).length
    },
    get completed() {
      return states.filter((state) => state.completed).length
    },
    update(state: { disabled: boolean }) {
      disabled = state.disabled
      if (disabled) detach()
      else attach()
      refresh()
    },
    refresh,
    dispose() {
      if (disposed) return
      disposed = true
      detach()
      preference()
      Application.off(Application.suspendEvent, refresh)
      Application.off(Application.resumeEvent, refresh)
      for (const state of states) stop(state)
    },
  }
}

export function attachNativeMotionRegion(reference: MotionRegion, target: View) {
  const resolveChild = (adapter: MotionSurfaceAdapter) => {
    const child = resolve(adapter)
    if (!inside(child, target) || child === target)
      throw new Error('Declare each surface inside this motion region.')
    return child
  }
  const scope = motionScope()
  const steps = (
    items: readonly (
      | import('@getcortexlabs/mavis-core/experimental').MotionStep<MotionSurfaceAdapter>
      | import('@getcortexlabs/mavis-core/experimental').MotionTimelineStep<MotionSurfaceAdapter>
    )[],
  ) =>
    items.map((step) =>
      typeof step === 'function' || 'run' in step
        ? step
        : ([resolveChild(step[0]), step[1], step[2]] as const),
    )
  const adapter: MotionRegionAdapter = {
    animateLayout: (change, { transition, ...options }) =>
      animateLayout(target, change, { ...transition, ...options }),
    ...nativePlatformMotion(target, resolveChild, scope),
    ...nativeCollectionMotion(target, resolveChild, scope),
    sequence: (items) =>
      scope.sequence(steps(items) as unknown as Parameters<typeof scope.sequence>[0]),
    timeline: (items) =>
      scope.timeline(steps(items) as unknown as Parameters<typeof scope.timeline>[0]),
    states(targets, definitions, options) {
      const timing = (
        input: import('@getcortexlabs/mavis-core/experimental').MotionStateTransition | undefined,
      ) => {
        const { targets, ...transition } = input ?? {}
        return { ...transition, ...targets }
      }
      const control = scope.states(
        Object.fromEntries(
          Object.entries(targets).map(([name, surface]) => [
            name,
            surface && resolveChild(surface),
          ]),
        ),
        Object.fromEntries(
          Object.entries(definitions).map(([name, frames]) => [
            name,
            Object.fromEntries(
              Object.entries(frames).filter(
                (row): row is [string, NonNullable<(typeof row)[1]>] => row[1] !== undefined,
              ),
            ),
          ]),
        ),
        { transition: timing(options?.transition) },
      )
      return {
        get current() {
          return control.current
        },
        get settled() {
          return control.settled
        },
        get paused() {
          return control.paused
        },
        to: (name, transition) => control.to(name, timing(transition)),
        attach: (name, surface) => control.attach(name, surface && resolveChild(surface)),
        pause: () => control.pause(),
        play: () => control.play(),
        stop: () => control.stop(),
        dispose: () => control.dispose(),
      }
    },
    kind: 'native',
    viewportEnter(surfaces, options) {
      surfaces.forEach(resolveChild)
      return viewportEnter(target, surfaces, options)
    },
    sharedLayout(options) {
      const control = sharedLayout(target, options)
      return {
        get active() {
          return control.active
        },
        attach: (surface, identity) => control.attach(resolveChild(surface), identity),
        transition: (change, options) => control.transition(change, options),
        cancel: () => control.cancel(),
        dispose: () => control.dispose(),
      }
    },
  }
  regions.set(adapter, target)
  try {
    const release = bindMotionRegion(reference, adapter)
    return () => {
      try {
        release()
      } finally {
        regions.delete(adapter)
        scope.dispose()
      }
    }
  } catch (error) {
    regions.delete(adapter)
    scope.dispose()
    throw error
  }
}
