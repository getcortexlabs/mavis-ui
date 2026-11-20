import type { WebPointerFollow, WebRuntime } from '@rafaelaugusto/jolt/web'

/** Observe inputs that can change Jolt's getter; Jolt alone decides availability and resets motion. */
export function watchPointerAvailability(
  pointer: WebPointerFollow,
  region: HTMLElement,
  runtime: WebRuntime,
  changed?: (available: boolean) => void,
) {
  if (!changed) return Object.assign(() => {}, { notify() {} })
  const document = region.ownerDocument
  const view = document.defaultView!
  let stopped = false,
    queued = false,
    previous: boolean | undefined
  const notify = () => {
    if (stopped || queued) return
    queued = true
    // Let Jolt process the same event first, including reduced-motion preferences.
    queueMicrotask(() => {
      queued = false
      if (stopped) return
      const available = pointer.available
      if (available !== previous) changed((previous = available))
    })
  }
  const hover = view.matchMedia('(any-hover: hover)')
  hover.addEventListener('change', notify)
  document.addEventListener('visibilitychange', notify)
  const offReduced = runtime.onReducedMotion(notify)
  const observer = new MutationObserver(notify)
  observer.observe(document, { childList: true, subtree: true })
  let ancestor: Element | null = region
  while (ancestor) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'aria-busy', 'inert'],
    })
    ancestor = ancestor.parentElement ?? (ancestor.getRootNode() as ShadowRoot).host ?? null
  }
  notify()
  return Object.assign(
    () => {
      if (stopped) return
      stopped = true
      observer.disconnect()
      hover.removeEventListener('change', notify)
      document.removeEventListener('visibilitychange', notify)
      offReduced()
      if (previous !== false) changed(false)
    },
    { notify },
  )
}
