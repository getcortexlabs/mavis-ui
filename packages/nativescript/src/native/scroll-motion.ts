import type { EventData, ScrollView, View } from '@nativescript/core'
import {
  bind,
  scrollValue,
  onReducedMotion,
  reducedMotion,
  type DerivedValue,
} from '@rafaelaugusto/jolt'
import {
  bindMotionScrollSource,
  type MotionScrollAdapter,
  type MotionScrollSource,
  type MotionScrollFrames,
  type MotionScrollOptions,
} from '@getcortexlabs/mavis-core/experimental'

const sources = new WeakMap<MotionScrollAdapter, ScrollView>()
export function nativeScrollElement(adapter: MotionScrollAdapter) {
  const source = sources.get(adapter)
  if (!source) throw new TypeError('Use a scrolling native MScreen.')
  return source
}
export function attachNativeScrollSource(reference: MotionScrollSource, source: ScrollView) {
  const adapter: MotionScrollAdapter = { kind: 'native' }
  sources.set(adapter, source)
  const unbind = bindMotionScrollSource(reference, adapter)
  return () => {
    unbind()
    sources.delete(adapter)
  }
}

/** Jolt owns numeric mappings and the application channels; Mavis resolves Screen/layout. */
export function nativeScrollMotion(
  adapter: MotionScrollAdapter,
  target: View,
  frames: MotionScrollFrames,
  options: MotionScrollOptions,
) {
  const source = sources.get(adapter)
  if (!source) throw new TypeError('Use a scrolling MScreen in this renderer.')
  const offset = scrollValue(source, {
    execution: options.execution === 'scheduler' ? 'javascript' : 'auto',
  })
  const active = new Map<string, readonly number[]>()
  for (const [key, values] of Object.entries(frames)) {
    if (key === 'scale') {
      if (!frames.scaleX) active.set('scaleX', values)
      if (!frames.scaleY) active.set('scaleY', values)
    } else active.set(key, values)
  }
  const bindings = new Map<string, () => void>()
  let bounded: DerivedValue | undefined
  let disposed = false
  let maximum = -1
  let content: View | undefined
  const clearBindings = () => {
    for (const release of bindings.values()) release()
    bindings.clear()
    bounded?.dispose()
    bounded = undefined
  }
  const apply = () => {
    if (disposed) return
    clearBindings()
    bounded = offset.to([0, Math.max(1, maximum)], [0, Math.max(0, maximum)])
    try {
      for (const [key, output] of active) {
        const input = output.map(
          (_, index) =>
            options.range[0] +
            (index * (options.range[1] - options.range[0])) / (output.length - 1),
        )
        const values =
          reducedMotion() && key !== 'opacity' ? output.map(() => output.at(-1)!) : output
        const mapped = bounded.to(input, values)
        let release: () => void
        try {
          release = bind(target, { [key]: mapped })
        } catch (error) {
          mapped.dispose()
          throw error
        }
        bindings.set(key, () => {
          release()
          mapped.dispose()
        })
      }
    } catch (error) {
      clearBindings()
      throw error
    }
  }
  const refresh = () => {
    if (disposed) return
    const next = Math.max(0, source.scrollableHeight)
    const changed = maximum !== next
    maximum = next
    if (content !== source.content) {
      content?.off('layoutChanged', layout)
      content = source.content
      content?.on('layoutChanged', layout)
    }
    if (changed) apply()
    // Re-read the actual bounded offset without a Vue update or an additional clock.
    offset.refresh()
  }
  const layout = (_event: EventData) => refresh()
  source.on('layoutChanged', layout)
  const offReduced = onReducedMotion(apply)
  const control = {
    get execution() {
      return disposed || !active.size
        ? ('released' as const)
        : offset.execution === 'native'
          ? ('native' as const)
          : ('scheduler' as const)
    },
    refresh,
    interrupt(properties: readonly string[]) {
      for (const property of properties)
        for (const key of property === 'scale' ? ['scaleX', 'scaleY'] : [property]) {
          active.delete(key)
          bindings.get(key)?.()
          bindings.delete(key)
        }
      if (!active.size) control.dispose()
    },
    dispose() {
      if (disposed) return
      disposed = true
      source.off('layoutChanged', layout)
      content?.off('layoutChanged', layout)
      offReduced()
      clearBindings()
      active.clear()
      offset.dispose()
    },
  }
  try {
    refresh()
  } catch (error) {
    control.dispose()
    throw error
  }
  return control
}
