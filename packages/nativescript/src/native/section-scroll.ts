import type { View } from '@nativescript/core'
import {
  sectionScrollRange,
  type MotionScrollAdapter,
  type MotionScrollFrames,
  type SectionScrollOptions,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeScrollElement, nativeScrollMotion } from './scroll-motion.js'

export function nativeSectionScroll(
  adapter: MotionScrollAdapter,
  section: View,
  target: View,
  frames: MotionScrollFrames,
  options: SectionScrollOptions,
) {
  const source = nativeScrollElement(adapter)
  let ancestor: View | undefined = section
  while (ancestor && ancestor !== source) ancestor = ancestor.parent as View | undefined
  if (ancestor !== source) throw new TypeError('The section must belong to the scrolling MScreen.')
  let link: ReturnType<typeof nativeScrollMotion> | undefined
  let previous = '',
    disposed = false
  const active = new Map(Object.entries(frames))
  if (active.has('scale')) {
    if (!active.has('scaleX')) active.set('scaleX', active.get('scale')!)
    if (!active.has('scaleY')) active.set('scaleY', active.get('scale')!)
    active.delete('scale')
  }
  const observed = new Set<View>()
  const refresh = () => {
    if (disposed) return
    const location = section.getLocationRelativeTo(source)
    if (!location) return
    const measured = sectionScrollRange(
      location.y + source.verticalOffset,
      section.getActualSize().height,
      source.getActualSize().height,
      Math.max(0, source.scrollableHeight),
      options,
    )
    const key = `${measured.range}:${measured.settled}`
    if (key === previous) {
      link?.refresh()
      return
    }
    const values = measured.settled
      ? Object.fromEntries(
          [...active].map(([property, values]) => [property, [values.at(-1)!, values.at(-1)!]]),
        )
      : Object.fromEntries(active)
    link?.dispose()
    link = nativeScrollMotion(adapter, target, values, {
      range: measured.range,
      execution: options.execution,
    })
    previous = key
  }
  for (let view: View | undefined = section; view; view = view.parent as View | undefined) {
    observed.add(view)
    if (view === source) break
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const view of observed) view.off('layoutChanged', refresh)
    observed.clear()
    link?.dispose()
  }
  try {
    for (const view of observed) view.on('layoutChanged', refresh)
    refresh()
  } catch (error) {
    dispose()
    throw error
  }
  return {
    get execution() {
      return disposed ? ('released' as const) : (link?.execution ?? ('released' as const))
    },
    refresh,
    interrupt(properties: readonly string[]) {
      for (const property of properties)
        for (const key of property === 'scale' ? ['scaleX', 'scaleY'] : [property])
          active.delete(key)
      link?.interrupt(properties)
      if (!active.size) dispose()
    },
    dispose,
  }
}
