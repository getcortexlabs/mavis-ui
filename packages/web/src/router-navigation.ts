import { nextTick } from 'vue'
import {
  createRouterNavigation,
  defineNavigationTransition,
  type MavisRouter,
  type NavigationTransition,
} from '@getcortexlabs/mavis-core'

type Route = { fullPath: string; matched?: readonly unknown[] }
export interface WebNavigationRouter extends MavisRouter {
  beforeResolve(guard: (to: Route, from: Route) => Promise<void> | void): () => void
  afterEach(hook: (to: Route, from: Route, failure?: unknown) => void): () => void
  options?: { history?: { state: Record<string, unknown> } }
  onError?(handler: (error: unknown) => void): () => void
}

/** Vue Router and Nuxt: browser snapshots decorate confirmed router navigation. */
export function createMavisNavigation(
  router: WebNavigationRouter,
  options: {
    transition?: NavigationTransition
    /** Nuxt can await its page:finish hook here when pages use async setup/Suspense. */
    ready?: (signal: AbortSignal, to: Route, from: Route) => void | Promise<void>
    /** Explicit focus target; default is [data-mavis-route-focus] or the page's h1. */
    focus?: () => HTMLElement | null
  } = {},
) {
  const policy = defineNavigationTransition(options.transition)
  const base = createRouterNavigation(router)
  const document = typeof globalThis.document === 'undefined' ? undefined : globalThis.document
  if (!document) return { ...base, dispose() {} }
  const window = document.defaultView!
  const position = () => {
    const value = router.options?.history?.state.position
    return typeof value === 'number' ? value : undefined
  }
  const focusByPosition = new Map<
    number,
    { node: WeakRef<HTMLElement>; id: string; key: string | null }
  >()
  const transitions = new Set<ViewTransition>()
  const focusCleanups = new Set<() => void>()
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const preference = () => {
    if (media.matches) for (const transition of transitions) transition.skipTransition()
  }
  media.addEventListener('change', preference)
  let cursor = position(),
    disposed = false,
    generation = 0
  let pending:
    | {
        to: Route
        finish(): void
        proceed(): void
        transition?: ViewTransition
        outgoing: HTMLElement | null
        generation: number
        backwards: boolean
        controller: AbortController
        ready: Promise<void>
      }
    | undefined
  const release = (skip: boolean) => {
    const old = pending
    pending = undefined
    old?.controller.abort()
    if (skip) old?.transition?.skipTransition()
    old?.proceed()
    old?.finish()
  }
  const reduced = () => media.matches
  const stopBefore = router.beforeResolve((to, from) => {
    release(true)
    const outgoing =
      document.activeElement instanceof window.HTMLElement
        ? (document.activeElement as HTMLElement)
        : null
    if (cursor !== undefined && outgoing && outgoing !== document.body) {
      focusByPosition.set(cursor, {
        node: new WeakRef(outgoing),
        id: outgoing.id,
        key: outgoing.getAttribute('data-mavis-focus-key'),
      })
      if (focusByPosition.size > 100) focusByPosition.delete(focusByPosition.keys().next().value!)
    }
    let proceed!: () => void, finish!: () => void
    const guard = new Promise<void>((resolve) => {
      proceed = resolve
    })
    const committed = new Promise<void>((resolve) => {
      finish = resolve
    })
    const current = {
      to,
      outgoing,
      proceed,
      finish,
      generation: ++generation,
      backwards: false,
      controller: new AbortController(),
      ready: Promise.resolve(),
      transition: undefined as ViewTransition | undefined,
    }
    pending = current
    try {
      current.ready = Promise.resolve(options.ready?.(current.controller.signal, to, from))
    } catch (error) {
      current.ready = Promise.reject(error)
    }
    void current.ready.catch(() => {})
    if (
      policy.name === 'none' ||
      policy.duration === 0 ||
      reduced() ||
      !document.startViewTransition
    ) {
      proceed()
      return guard
    }
    try {
      current.transition = document.startViewTransition(async () => {
        proceed()
        await committed
      })
      transitions.add(current.transition)
      const forget = () => transitions.delete(current.transition!)
      void current.transition.finished.then(forget, forget)
      // Rejected/skipped snapshots must never reject the router guard or leave it waiting.
      void current.transition.updateCallbackDone.catch(() => {
        proceed()
        finish()
      })
      void current.transition.finished.catch(() => {})
      void current.transition.ready
        .then(() => {
          if (disposed || current.generation !== generation || reduced()) {
            current.transition?.skipTransition()
            return
          }
          const backwards = current.backwards
          const distance = backwards ? '-24px' : '24px'
          document.documentElement.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: policy.duration,
            fill: 'both',
            pseudoElement: '::view-transition-old(root)',
          })
          document.documentElement.animate(
            policy.name === 'slide'
              ? [
                  { opacity: 0, transform: `translateX(${distance})` },
                  { opacity: 1, transform: 'none' },
                ]
              : [{ opacity: 0 }, { opacity: 1 }],
            {
              duration: policy.duration,
              fill: 'both',
              pseudoElement: '::view-transition-new(root)',
            },
          )
        })
        .catch(() => {})
    } catch {
      proceed()
      finish()
    }
    return guard
  })
  const stopAfter = router.afterEach((to, _from, failure) => {
    const current = pending
    if (!current || current.to !== to) return
    if (failure) {
      release(true)
      return
    }
    const nextPosition = position(),
      backwards = cursor !== undefined && nextPosition !== undefined && nextPosition < cursor
    current.backwards = backwards
    cursor = nextPosition
    void (async () => {
      try {
        await nextTick()
        await current.ready
        if (disposed || current.generation !== generation) return
        const active = document.activeElement
        const untouched =
          active === document.body || active === current.outgoing || !active?.isConnected
        if (untouched) {
          const saved =
            backwards && nextPosition !== undefined ? focusByPosition.get(nextPosition) : undefined
          const old = saved?.node.deref()
          const remembered = old?.isConnected
            ? old
            : saved?.id
              ? document.getElementById(saved.id)
              : saved?.key
                ? [...document.querySelectorAll<HTMLElement>('[data-mavis-focus-key]')].find(
                    (element) => element.getAttribute('data-mavis-focus-key') === saved.key,
                  )
                : undefined
          const target = remembered?.isConnected
            ? remembered
            : (options.focus?.() ??
              document.querySelector<HTMLElement>('[data-mavis-route-focus], main h1, h1'))
          if (target?.isConnected) {
            const temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0
            if (temporary) target.setAttribute('tabindex', '-1')
            target.focus({ preventScroll: true })
            if (temporary) {
              const cleanup = () => {
                target.removeEventListener('blur', cleanup)
                if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex')
                focusCleanups.delete(cleanup)
              }
              focusCleanups.add(cleanup)
              target.addEventListener('blur', cleanup, { once: true })
              if (document.activeElement !== target) cleanup()
            }
          }
        }
      } finally {
        current.finish()
        if (pending === current) {
          pending = undefined
        }
      }
    })().catch(() => {
      current.transition?.skipTransition()
    })
  })
  const stopError = router.onError?.(() => release(true))
  return {
    ...base,
    dispose() {
      if (disposed) return
      disposed = true
      generation++
      release(true)
      for (const transition of transitions) transition.skipTransition()
      transitions.clear()
      media.removeEventListener('change', preference)
      stopBefore()
      stopAfter()
      stopError?.()
      focusByPosition.clear()
      for (const cleanup of [...focusCleanups]) cleanup()
    },
  }
}
