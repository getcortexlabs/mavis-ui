import { computed, watch, type Ref } from 'vue'
import { useConnectedMotion } from './connected-motion.js'
import { useMotionContext } from './motion-context.js'
import {
  bindMotionScrollSource,
  type MotionScrollAdapter,
  type MotionScrollSource,
} from '@getcortexlabs/mavis-core/experimental'

const sources = new WeakMap<MotionScrollAdapter, HTMLElement>()
export function webScrollElement(adapter: MotionScrollAdapter) {
  const source = sources.get(adapter)
  if (!source) throw new TypeError('Use a scrolling MScreen in this renderer.')
  return source
}

export function useScrollMotion(
  element: Ref<HTMLElement | undefined>,
  source: () => MotionScrollSource | undefined,
  enabled: () => boolean,
) {
  let release: (() => void) | undefined
  const clear = () => {
    release?.()
    release = undefined
  }
  const attach = (target: HTMLElement) => {
    clear()
    const reference = source()
    if (!enabled() || !reference) return
    const adapter: MotionScrollAdapter = { kind: 'web' }
    sources.set(adapter, target)
    const unbind = bindMotionScrollSource(reference, adapter)
    let disposed = false
    const view = target.ownerDocument.defaultView!
    const refresh = () => {
      if (!disposed) reference.refresh()
    }
    let pendingFrame: number | undefined
    const scheduleRefresh = () => {
      if (disposed || pendingFrame !== undefined) return
      pendingFrame = view.requestAnimationFrame(() => {
        pendingFrame = undefined
        refresh()
      })
    }
    // A ScrollTimeline can become inactive when content no longer overflows. Rebase
    // its retained pose on layout changes too, without observing values every frame.
    // Source refresh also refreshes section links, which may replace their
    // geometry observers. Never do that inside ResizeObserver delivery.
    const resize = new view.ResizeObserver(scheduleRefresh)
    const observed = new Set<Element>()
    const observe = () => {
      // Keep existing observations across text/subtree mutations. Re-observing an
      // unchanged ancestor during resize delivery can trigger a WebKit resize loop.
      const wanted = new Set<Element>([target, ...target.children])
      for (const node of observed) {
        if (wanted.has(node)) continue
        resize.unobserve(node)
        observed.delete(node)
      }
      for (const node of wanted) {
        if (observed.has(node)) continue
        resize.observe(node)
        observed.add(node)
      }
    }
    const mutations = new view.MutationObserver(() => {
      observe()
      scheduleRefresh()
    })
    observe()
    mutations.observe(target, { childList: true, characterData: true, subtree: true })
    target.ownerDocument.fonts?.addEventListener('loadingdone', scheduleRefresh)
    view.addEventListener('resize', scheduleRefresh)
    release = () => {
      disposed = true
      if (pendingFrame !== undefined) view.cancelAnimationFrame(pendingFrame)
      resize.disconnect()
      observed.clear()
      mutations.disconnect()
      target.ownerDocument.fonts?.removeEventListener('loadingdone', scheduleRefresh)
      view.removeEventListener('resize', scheduleRefresh)
      unbind()
      sources.delete(adapter)
    }
  }
  const target = computed(() => (enabled() && source() ? element.value : undefined))
  useConnectedMotion(target, useMotionContext(), (_, connected) => {
    const stop = watch([source, enabled], () => attach(connected), {
      immediate: true,
      flush: 'post',
    })
    return () => {
      stop()
      clear()
    }
  })
}
