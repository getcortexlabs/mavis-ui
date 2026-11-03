import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  shallowRef,
  watch,
  type ShallowRef,
} from 'vue'

/** Width-only observation: layout updates run outside ResizeObserver's delivery loop. */
export function useContentWidth(
  element: ShallowRef<HTMLElement | undefined>,
  enabled: () => boolean,
) {
  const width = shallowRef<number>()
  let observer: ResizeObserver | undefined
  let frame: number | undefined
  let measured: number | undefined
  let mounted = false
  function stop() {
    observer?.disconnect()
    observer = undefined
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    measured = undefined
  }
  function start() {
    if (
      !mounted ||
      observer ||
      !enabled() ||
      !element.value ||
      typeof ResizeObserver === 'undefined'
    )
      return
    observer = new ResizeObserver(([entry]) => {
      if (!mounted || !enabled() || !entry || entry.contentRect.width === measured) return
      measured = entry.contentRect.width
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = undefined
        width.value = measured
      })
    })
    observer.observe(element.value)
  }
  onMounted(() => {
    mounted = true
    start()
  })
  onActivated(() => {
    mounted = true
    start()
  })
  onDeactivated(() => {
    mounted = false
    stop()
  })
  onBeforeUnmount(() => {
    mounted = false
    stop()
  })
  watch(enabled, () => {
    stop()
    if (enabled()) start()
    else width.value = undefined
  })
  return width
}
