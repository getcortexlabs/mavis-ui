import { onActivated, onBeforeUnmount, onDeactivated, watch, type Ref } from 'vue'
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
  let active = true
  let release: (() => void) | undefined
  const clear = () => {
    release?.()
    release = undefined
  }
  const attach = () => {
    clear()
    const reference = source(),
      target = element.value
    if (!active || !enabled() || !reference || !target) return
    const adapter: MotionScrollAdapter = { kind: 'web' }
    sources.set(adapter, target)
    const unbind = bindMotionScrollSource(reference, adapter)
    let disposed = false
    const view = target.ownerDocument.defaultView!
    const refresh = () => {
      if (!disposed) reference.refresh()
    }
    // A ScrollTimeline can become inactive when content no longer overflows. Rebase
    // its retained pose on layout changes too, without observing values every frame.
    const resize = new view.ResizeObserver(refresh)
    const observe = () => {
      resize.disconnect()
      resize.observe(target)
      for (const child of target.children) resize.observe(child)
    }
    const mutations = new view.MutationObserver(() => {
      observe()
      refresh()
    })
    observe()
    mutations.observe(target, { childList: true, characterData: true, subtree: true })
    target.ownerDocument.fonts?.addEventListener('loadingdone', refresh)
    view.addEventListener('resize', refresh)
    release = () => {
      disposed = true
      resize.disconnect()
      mutations.disconnect()
      target.ownerDocument.fonts?.removeEventListener('loadingdone', refresh)
      view.removeEventListener('resize', refresh)
      unbind()
      sources.delete(adapter)
    }
  }
  watch([element, source, enabled], attach, { flush: 'post' })
  onActivated(() => {
    active = true
    attach()
  })
  onDeactivated(() => {
    active = false
    clear()
  })
  onBeforeUnmount(clear)
}
