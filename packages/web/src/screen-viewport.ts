import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

export function useScreenViewport(scroll: () => boolean) {
  const element = shallowRef<HTMLElement>()
  let refresh: (() => void) | undefined
  let release: (() => void) | undefined

  onMounted(() => {
    const screen = element.value
    if (!screen || typeof window === 'undefined') return
    const viewport = window.visualViewport
    let frame = 0

    const keepFocusVisible = () => {
      frame = 0
      if (!scroll() || (viewport && Math.abs(viewport.scale - 1) > 0.01)) return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || active === screen || !screen.contains(active)) return
      const bounds = active.getBoundingClientRect()
      const area = screen.getBoundingClientRect()
      // Safari can pan the document as well as the visual viewport while opening
      // the keyboard. Express both bounds in getBoundingClientRect coordinates.
      const viewportTop = viewport ? viewport.pageTop - window.scrollY : 0
      const top = Math.max(area.top, viewportTop) + 8
      const bottom = Math.min(area.bottom, viewportTop + (viewport?.height ?? innerHeight)) - 8
      if (bounds.bottom > bottom) screen.scrollTop += bounds.bottom - bottom
      else if (bounds.top < top) screen.scrollTop += bounds.top - top
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(keepFocusVisible)
    }
    refresh = () => {
      // Keyboard resize and browser chrome change the visual viewport. Pinch zoom must
      // keep the layout at its original scale so users can pan around enlarged content.
      if (viewport && Math.abs(viewport.scale - 1) <= 0.01 && scroll()) {
        const origin = screen.getBoundingClientRect().top + window.scrollY
        const height = viewport.height + Math.max(0, viewport.pageTop - origin)
        screen.style.setProperty('--m-viewport-height', `${height}px`)
      } else if (!scroll()) screen.style.removeProperty('--m-viewport-height')
      schedule()
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(screen)
    viewport?.addEventListener('resize', refresh)
    viewport?.addEventListener('scroll', refresh)
    screen.addEventListener('focusin', schedule)
    refresh()
    release = () => {
      observer.disconnect()
      viewport?.removeEventListener('resize', refresh!)
      viewport?.removeEventListener('scroll', refresh!)
      screen.removeEventListener('focusin', schedule)
      cancelAnimationFrame(frame)
    }
  })
  watch(scroll, () => refresh?.())
  onBeforeUnmount(() => release?.())
  return element
}
