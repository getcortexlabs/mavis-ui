import { motionRecipe, type MavisTheme } from '@getcortexlabs/mavis-core'
import type { RevealHost } from '@getcortexlabs/mavis-core/vue'
import type { WebMotionContext } from './motion-context.js'

export function revealHost(
  element: HTMLElement,
  context: WebMotionContext,
  theme: () => MavisTheme,
  hidden: () => boolean,
): RevealHost {
  let trigger: HTMLElement | undefined
  // Initial SSR/KeepAlive presentation needs no animation or geometry acquisition.
  let lease: ReturnType<typeof context.acquire> | undefined
  const originalHeight = element.style.height
  return {
    animate(open, fromClosed) {
      if (!element.isConnected) return { finished: Promise.resolve(true), stop() {} }
      lease ??= context.acquire(element.ownerDocument)
      const runtime = lease.runtime
      if (fromClosed) {
        element.style.height = '0px'
        runtime.set(element, { opacity: 0 })
      }
      const recipe = motionRecipe(theme(), open ? 'enter' : 'exit')
      const size = runtime.animateSize(element, { height: open ? 'auto' : 0 }, recipe.transition)
      const opacity = runtime.animate(element, { opacity: open ? 1 : 0 }, recipe.transition)
      return {
        finished: size.finished,
        stop() {
          size.stop({ restore: true })
          opacity.stop()
        },
      }
    },
    interactive(enabled) {
      element.toggleAttribute('inert', !enabled || Boolean(hidden()))
      if (!enabled || hidden()) element.setAttribute('aria-hidden', 'true')
      else element.removeAttribute('aria-hidden')
    },
    captureFocus() {
      const active = element.ownerDocument.activeElement
      if (
        active instanceof element.ownerDocument.defaultView!.HTMLElement &&
        !element.contains(active)
      )
        trigger = active
    },
    restoreFocus() {
      if (element.contains(element.ownerDocument.activeElement) && trigger?.isConnected)
        trigger.focus({ preventScroll: true })
    },
    release() {
      lease?.runtime.release(element)
      lease?.release()
      lease = undefined
      element.style.height = originalHeight
    },
  }
}
