import {
  watch,
  onScopeDispose,
  onMounted,
  onUpdated,
  onActivated,
  onDeactivated,
  ref,
  type Ref,
} from 'vue'
import { componentMotion, type ComponentMotion } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import type { WebRuntime, Keyframes } from '@rafaelaugusto/jolt/web'
import { useConnectedMotion } from './connected-motion.js'
import { useMotionContext } from './motion-context.js'

/** Private presentation targets only: application transforms remain on their own surface. */
export function useComponentPaint(
  element: Ref<HTMLElement | undefined>,
  values: () => Keyframes,
  kind: ComponentMotion = 'selection',
) {
  const { theme } = useMavisTheme()
  useConnectedMotion(element, useMotionContext(), (runtime, target) => {
    let playback = runtime.animate(target, values(), { duration: 0 })
    const display = target.ownerDocument.defaultView!.getComputedStyle(target).display
    // Selection paint can be claimed inside a closed sheet before its box gets dimensions.
    // Keep the geometry lease through opening, responsive resizing and later selections.
    const geometry = ['inline', 'none', 'contents'].includes(display)
      ? undefined
      : runtime.observeGeometry(target)
    const off = watch(
      values,
      () => {
        playback = runtime.animate(target, values(), componentMotion(theme.value, kind))
      },
      { deep: true, flush: 'post' },
    )
    return () => {
      off()
      playback.stop()
      runtime.release(target)
      geometry?.dispose()
    }
  })
}

/** Vue transition hooks share one presentation per element, including cancelled leaves. */
export function useComponentTransition(offset = 6) {
  const { theme } = useMavisTheme()
  const context = useMotionContext()
  const entries = new Map<
    Element,
    {
      lease: ReturnType<typeof context.acquire>
      playback?: ReturnType<WebRuntime['animate']>
      generation: number
      leaving?: () => void
    }
  >()
  function release(element: Element) {
    const entry = entries.get(element)
    if (!entry) return
    entries.delete(element)
    entry.generation++
    entry.playback?.stop()
    entry.lease.runtime.release(element as HTMLElement)
    entry.lease.release()
  }
  function play(element: Element, done: () => void, entering: boolean) {
    let entry = entries.get(element)
    const fresh = !entry
    if (!entry) {
      entry = { lease: context.acquire(element.ownerDocument), generation: 0 }
      entries.set(element, entry)
    }
    const token = ++entry.generation
    entry.leaving = entering ? undefined : done
    const target = element as HTMLElement
    if (entering && fresh)
      entry.lease.runtime.animate(target, { opacity: 0, y: offset }, { duration: 0 })
    entry.playback = entry.lease.runtime.animate(
      target,
      entering ? { opacity: 1, y: 0 } : { opacity: 0, y: offset / 2 },
      entering
        ? componentMotion(theme.value, 'overlay')
        : { duration: theme.value.motion.exitDuration },
    )
    void entry.playback.finished.then(() => {
      if (entries.get(element) !== entry || entry.generation !== token) return
      entry.leaving = undefined
      done()
      if (!entering) release(element)
    })
  }
  onScopeDispose(() => {
    for (const [element, { leaving }] of [...entries]) {
      release(element)
      // Vue keeps a leaving element until done(); without it the node outlives its owner.
      leaving?.()
    }
  })
  return {
    css: false,
    appear: true,
    onEnter: (element: Element, done: () => void) => play(element, done, true),
    onLeave: (element: Element, done: () => void) => play(element, done, false),
    onAfterLeave: release,
    onEnterCancelled: (element: Element) => {
      const entry = entries.get(element)
      if (entry) entry.generation++
    },
    onLeaveCancelled: (element: Element) => {
      const entry = entries.get(element)
      if (!entry) return
      entry.generation++
      entry.leaving = undefined
    },
  }
}

/** Fixed base geometry avoids feedback between an animated marker and its ResizeObserver. */
export function useSelectionIndicator(read: () => HTMLElement | undefined) {
  const marker = ref<HTMLElement>()
  const bounds = ref({ x: 0, width: 0 })
  useComponentPaint(marker, () => ({
    x: bounds.value.x,
    scaleX: Math.max(0.0001, bounds.value.width / 100),
    opacity: bounds.value.width ? 1 : 0,
  }))
  let observer: ResizeObserver | undefined
  let mutations: MutationObserver | undefined
  let parent: HTMLElement | null | undefined
  const measured = new Set<Element>()
  function measure() {
    if (!observer) return
    const target = read()
    const next = target ? { x: target.offsetLeft, width: target.offsetWidth } : { x: 0, width: 0 }
    if (next.x !== bounds.value.x || next.width !== bounds.value.width) bounds.value = next
  }
  function observe() {
    if (!observer) return
    const nextParent = marker.value?.parentElement
    if (parent !== nextParent) {
      mutations?.disconnect()
      parent = nextParent
      // Direction can change on any ancestor without resizing the selected control.
      for (let node = parent; node; node = node.parentElement)
        mutations?.observe(node, {
          attributes: true,
          attributeFilter: ['dir', 'class', 'style'],
          childList: node === parent,
        })
    }
    // Earlier siblings can resize/reorder while the selected control keeps its dimensions.
    // Never observe the animated marker itself.
    const next = new Set<Element>(parent ? [parent, ...parent.children] : [])
    if (marker.value) next.delete(marker.value)
    for (const element of measured)
      if (!next.has(element)) {
        observer.unobserve(element)
        measured.delete(element)
      }
    for (const element of next)
      if (!measured.has(element)) {
        observer.observe(element)
        measured.add(element)
      }
    measure()
  }
  function start() {
    if (observer) return
    observer = new ResizeObserver(measure)
    mutations = new MutationObserver(observe)
    observe()
  }
  function stop() {
    observer?.disconnect()
    observer = undefined
    mutations?.disconnect()
    mutations = undefined
    parent = undefined
    measured.clear()
  }
  watch(read, observe, { flush: 'post' })
  onMounted(start)
  onUpdated(observe)
  onActivated(start)
  onDeactivated(stop)
  onScopeDispose(stop)
  return marker
}
