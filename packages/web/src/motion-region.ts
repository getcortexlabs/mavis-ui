import {
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  provide,
  shallowRef,
  watch,
  type VNode,
} from 'vue'
import {
  bindMotionRegion,
  type MotionRegion,
  type MotionRegionAdapter,
} from '@getcortexlabs/mavis-core/experimental'
import { createMotionContext, motionContextKey } from './motion-context.js'
import { webSurfaceTarget } from './motion-surface.js'
import { webScrollElement } from './scroll-motion.js'
import type { WebRuntime } from '@rafaelaugusto/jolt/web'

const regions = new WeakMap<MotionRegionAdapter, { target: HTMLElement; runtime: WebRuntime }>()
export function webRegion(adapter: MotionRegionAdapter) {
  const region = regions.get(adapter)
  if (!region) throw new TypeError('Use a mounted Web motion region.')
  return region
}
function regionAdapter(runtime: WebRuntime, target: HTMLElement): MotionRegionAdapter {
  const resolve = (surface: Parameters<typeof webSurfaceTarget>[0]) => {
    const value = webSurfaceTarget(surface)
    if (value.runtime !== runtime || !target.contains(value.target))
      throw new TypeError('Declare each surface inside this motion region.')
    return value.target
  }
  const steps = (
    items: readonly (
      | import('@getcortexlabs/mavis-core/experimental').MotionStep<
          import('@getcortexlabs/mavis-core/experimental').MotionSurfaceAdapter
        >
      | import('@getcortexlabs/mavis-core/experimental').MotionTimelineStep<
          import('@getcortexlabs/mavis-core/experimental').MotionSurfaceAdapter
        >
    )[],
  ) =>
    items.map((step) =>
      typeof step === 'function' || 'run' in step
        ? step
        : ([resolve(step[0]), step[1], step[2]] as const),
    )
  const adapter: MotionRegionAdapter = {
    sequence: (items) =>
      runtime.sequence(steps(items) as unknown as Parameters<WebRuntime['sequence']>[0]),
    timeline: (items) =>
      runtime.timeline(steps(items) as unknown as Parameters<WebRuntime['timeline']>[0]),
    states(targets, definitions, options) {
      const timing = (
        input: import('@getcortexlabs/mavis-core/experimental').MotionStateTransition | undefined,
      ) => {
        const { targets, ...transition } = input ?? {}
        return { ...transition, ...targets }
      }
      const control = runtime.motionStates(
        Object.fromEntries(
          Object.entries(targets).map(([name, surface]) => [name, surface && resolve(surface)]),
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
        attach: (name, surface) => control.attach(name, surface && resolve(surface)),
        pause: () => control.pause(),
        play: () => control.play(),
        stop: () => control.stop(),
        dispose: () => control.dispose(),
      }
    },
    kind: 'web',
    viewportEnter(surfaces, options) {
      const control = runtime.viewportEnter(surfaces.map(resolve), {
        keyframes: options.frames ?? { opacity: [0, 1], y: [20, 0] },
        transition: { duration: 450, ...options.transition, stagger: options.stagger ?? 70 },
        root: options.root && webScrollElement(options.root),
        rootMargin: `${options.margin ?? 0}px`,
        threshold: options.threshold,
        once: options.once,
        disabled: options.disabled,
      })
      return {
        execution: target.ownerDocument.defaultView!.IntersectionObserver
          ? 'intersection-observer'
          : 'static',
        get pending() {
          return control.pending
        },
        get completed() {
          return control.completed
        },
        update: (state) => control.update(state),
        refresh: () => control.refresh(),
        dispose: () => control.dispose(),
      }
    },
    sharedLayout(options) {
      const control = runtime.sharedLayout(target, options)
      return {
        get active() {
          return control.active
        },
        attach: (surface, identity) => control.attach(resolve(surface), identity),
        transition: (change, options) => control.transition(change, options),
        cancel: () => control.cancel(),
        dispose: () => control.dispose(),
      }
    },
    diagnostics(options) {
      const control = runtime.diagnostics(options)
      return {
        snapshot: () => ({
          ...control.snapshot(),
          identity: options.identity,
          execution: 'jolt-web' as const,
        }),
        clear: () => control.clear(),
        dispose: () => control.dispose(),
      }
    },
  }
  regions.set(adapter, { target, runtime })
  return adapter
}

/** The MBox is the stable input/layout region, separate from every animated child. */
export function useMotionRegion(reference: () => MotionRegion | undefined) {
  const declared = Boolean(reference())
  const context = createMotionContext()
  if (declared) provide(motionContextKey, context)
  const element = shallowRef<HTMLElement>()
  let active = true,
    release: (() => void) | undefined
  const clear = () => {
    release?.()
    release = undefined
  }
  const attach = () => {
    clear()
    const region = reference(),
      target = element.value
    if (!active || !region || !target) return
    if (!declared)
      throw new Error('Declare motionRegion when mounting MBox; remount to add a region.')
    const lease = context.acquire(target.ownerDocument)
    const adapter = regionAdapter(lease.runtime, target)
    try {
      const unbind = bindMotionRegion(region, adapter)
      release = () => {
        try {
          unbind()
        } finally {
          regions.delete(adapter)
          lease.release()
        }
      }
    } catch (error) {
      regions.delete(adapter)
      lease.release()
      throw error
    }
  }
  watch([element, reference], attach, { flush: 'post' })
  onActivated(() => {
    active = true
    attach()
  })
  onDeactivated(() => {
    active = false
    clear()
  })
  onBeforeUnmount(clear)
  return {
    onVnodeMounted: (node: VNode) => {
      element.value = node.el as HTMLElement
    },
    onVnodeBeforeUnmount: () => {
      element.value = undefined
      clear()
    },
  }
}
