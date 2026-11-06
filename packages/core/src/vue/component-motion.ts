import { markRaw, onScopeDispose, watch, type WatchSource } from '@vue/runtime-core'
import {
  createMotionRegion,
  createMotionSurface,
  type MotionValues,
  type MotionPlayback,
  type MotionSharedLayout,
  type MotionRegion,
} from '../experimental.js'
import { componentMotion, type ComponentMotion } from '../motion.js'
import { useMavisTheme } from './theme.js'

const componentRegions = new WeakSet<MotionRegion>()
function createComponentRegion() {
  const region = markRaw(createMotionRegion())
  componentRegions.add(region)
  return region
}

/** @internal Built-in layout must not isolate application-owned descendant surfaces. */
export function isComponentMotionRegion(region: MotionRegion) {
  return componentRegions.has(region)
}

/** A private decorative surface. Initial state is immediate; subsequent states are continuous. */
export function useComponentState(read: () => MotionValues, kind: ComponentMotion = 'selection') {
  const { theme } = useMavisTheme()
  const surface = markRaw(createMotionSurface())
  onScopeDispose(
    surface.use((owner) => {
      owner.set(read())
    }),
  )
  watch(
    read,
    (values) => {
      if (surface.available) surface.animate(values, componentMotion(theme.value, kind))
    },
    { deep: true, flush: 'post' },
  )
  return surface
}

/** Vue pre-watch captures old layout; Jolt waits for renderer layout after the patch. */
export function useComponentLayout(source: WatchSource, enter = true, enabled = () => true) {
  const { theme } = useMavisTheme()
  const region = createComponentRegion()
  let active: MotionPlayback | undefined
  watch(
    source,
    () => {
      if (enabled() && region.available) {
        active = region.animateLayout(() => {}, {
          transition: componentMotion(theme.value, 'layout'),
          size: false,
          enter,
        })
      }
    },
    { deep: true, flush: 'pre' },
  )
  onScopeDispose(() => active?.stop())
  return region
}

/** One identity follows the active destination without moving focus or the destination itself. */
export function useComponentSelection(source: WatchSource) {
  const { theme } = useMavisTheme()
  const region = createComponentRegion()
  const marker = markRaw(createMotionSurface())
  let layout: MotionSharedLayout | undefined
  onScopeDispose(
    region.onAvailable(() => {
      const owned = region.sharedLayout({ transition: componentMotion(theme.value, 'selection') })
      layout = owned
      const detach = owned.attach(marker, 'selection')
      return () => {
        detach()
        owned.dispose()
        if (layout === owned) layout = undefined
      }
    }),
  )
  watch(
    source,
    () => {
      layout?.transition(() => {}, componentMotion(theme.value, 'selection'))
    },
    { flush: 'pre' },
  )
  return { region, marker }
}

/** Short content feedback; editable values must never use this presentation recipe. */
export function useComponentContent(source?: WatchSource, appear = true) {
  const { theme } = useMavisTheme()
  const surface = markRaw(createMotionSurface())
  const play = () => {
    if (surface.available)
      surface.animate({ opacity: [0.65, 1], y: [3, 0] }, componentMotion(theme.value, 'overlay'))
  }
  onScopeDispose(
    surface.use(() => {
      if (appear) play()
    }),
  )
  if (source) watch(source, play, { flush: 'post' })
  return surface
}
