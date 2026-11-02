import {
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  shallowRef,
  watch,
  type Ref,
  type VNode,
} from 'vue'
import { createWebRuntime, type WebRuntime } from '@rafaelaugusto/jolt/web'
import { pressMotion, type MavisTheme } from '@getcortexlabs/mavis-core'
import { bindMotionSurface, type MotionSurface } from '@getcortexlabs/mavis-core/experimental'

// Chip keeps its separate CSS feedback until its interaction contract is migrated.
export function pressStyle(scale: number) {
  return { '--m-press-scale': scale, '--m-press-duration': '120ms', '--m-press-ease': 'ease-out' }
}

/** Input belongs to Mavis; Jolt owns finite playback and the independent scale layer. */
export function attachWebPress(
  target: HTMLElement,
  runtime: WebRuntime,
  enabled: () => boolean,
  scale: () => number,
  applicationSurface: () => boolean = () => false,
) {
  const window = target.ownerDocument.defaultView!
  const document = target.ownerDocument
  const abort = new window.AbortController()
  const layer = 'mavis-press'
  let pointer: number | undefined
  let key: string | undefined
  let pressed = false
  let used = false
  let disposed = false
  let playback: ReturnType<WebRuntime['animate']> | undefined
  const origin = target.style.transformOrigin
  let pinnedOrigin: string | undefined
  const restoreOrigin = () => {
    if (target.style.transformOrigin === pinnedOrigin) target.style.transformOrigin = origin
    pinnedOrigin = undefined
  }
  // Jolt rc.5 treats a changed computed origin as a new surface. Pin the pivot
  // through label/layout updates during feedback; an idle control releases it below.
  const pinOrigin = () => {
    if (pinnedOrigin !== undefined) return
    pinnedOrigin = window.getComputedStyle(target).transformOrigin
    target.style.transformOrigin = pinnedOrigin
  }
  if (applicationSurface()) pinOrigin()
  const blocked = () => !enabled() || Boolean(target.closest('[inert], [aria-disabled="true"]'))
  const apply = () => {
    const recipe = pressMotion(scale())[pressed ? 'pressed' : 'released']
    pinOrigin()
    used = true
    const handle = runtime.animate(target, recipe[0], { ...recipe[1], layer })
    playback = handle
    if (!pressed)
      void handle.finished.then((finished) => {
        if (!finished || disposed || pressed || playback !== handle || applicationSurface()) return
        runtime.release(target)
        used = false
        restoreOrigin()
      })
  }
  const cancel = () => {
    pointer = undefined
    key = undefined
    if (!pressed) return
    pressed = false
    apply()
  }
  const listen = <T extends Event>(
    node: EventTarget,
    type: string,
    callback: (event: T) => void,
    capture = false,
  ) =>
    node.addEventListener(type, callback as EventListener, {
      signal: abort.signal,
      capture,
      passive: true,
    })
  listen(target, 'pointerdown', (event: PointerEvent) => {
    if (
      event.defaultPrevented ||
      blocked() ||
      pointer !== undefined ||
      key ||
      !event.isPrimary ||
      event.button !== 0
    )
      return
    for (const node of event.composedPath()) {
      if (node === target) break
      if (
        node instanceof window.Element &&
        node.matches('button, a[href], input, select, textarea, [contenteditable], [role="button"]')
      )
        return
    }
    pointer = event.pointerId
    pressed = true
    apply()
  })
  const end = (event: PointerEvent) => {
    if (event.pointerId === pointer) cancel()
  }
  listen(window, 'pointerup', end, true)
  listen(window, 'pointercancel', end, true)
  listen(target, 'lostpointercapture', end)
  listen(target, 'pointerleave', (event: PointerEvent) => {
    if (event.pointerType === 'mouse') end(event)
  })
  listen(
    window,
    'pointermove',
    (event: PointerEvent) => {
      if (event.pointerId === pointer && !(event.buttons & 1)) cancel()
    },
    true,
  )
  // Capture before the Card's keyboard activation handler prevents the default action.
  listen(
    target,
    'keydown',
    (event: KeyboardEvent) => {
      if (
        event.target !== target ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        blocked() ||
        pointer !== undefined ||
        key ||
        ![' ', 'Enter'].includes(event.key)
      )
        return
      key = event.key
      pressed = true
      apply()
    },
    true,
  )
  listen(
    window,
    'keyup',
    (event: KeyboardEvent) => {
      if (event.key === key) cancel()
    },
    true,
  )
  listen(target, 'blur', () => {
    if (key) cancel()
  })
  listen(window, 'blur', cancel)
  listen(document, 'visibilitychange', () => {
    if (document.hidden) cancel()
  })
  listen(
    document,
    'scroll',
    (event: Event) => {
      if (
        pointer !== undefined &&
        (event.target === document ||
          (event.target instanceof window.Node && event.target.contains(target)))
      )
        cancel()
    },
    true,
  )
  return {
    pinOrigin,
    refresh() {
      if (blocked()) {
        pressed = false
        pointer = undefined
        key = undefined
        if (used) {
          runtime.animate(target, { scale: 1 }, { duration: 0, layer })
          if (!applicationSurface()) {
            runtime.release(target)
            used = false
            playback = undefined
            restoreOrigin()
          }
        }
      } else if (pressed) apply()
    },
    dispose() {
      disposed = true
      abort.abort()
      if (used && target.isConnected) runtime.animate(target, { scale: 1 }, { duration: 0, layer })
      restoreOrigin()
    },
  }
}

export function usePressFeedback(
  enabled: () => boolean,
  theme: Readonly<Ref<MavisTheme>>,
  surface?: () => MotionSurface | undefined,
) {
  const element = shallowRef<HTMLElement | null>(null)
  let runtime: WebRuntime | undefined
  let feedback: ReturnType<typeof attachWebPress> | undefined
  let unbind: (() => void) | undefined
  const release = () => {
    unbind?.()
    unbind = undefined
    feedback?.dispose()
    feedback = undefined
    runtime?.dispose()
    runtime = undefined
  }
  const bind = () => {
    unbind?.()
    unbind = undefined
    const target = element.value
    const current = runtime
    if (target && current && surface?.()) {
      feedback?.pinOrigin()
      unbind = bindMotionSurface(surface()!, {
        animate: (values, options) => current.animate(target, values, options),
        set: (values) => current.set(target, values),
      })
    }
  }
  const attach = () => {
    const target = element.value
    if (!target || runtime) return
    runtime = createWebRuntime(target.ownerDocument)
    feedback = attachWebPress(
      target,
      runtime,
      enabled,
      () => theme.value.motion.pressScale,
      () => Boolean(surface?.()),
    )
    bind()
  }
  let active = true
  watch(
    element,
    () => {
      release()
      if (active) attach()
    },
    { flush: 'post' },
  )
  onActivated(() => {
    active = true
    attach()
  })
  onDeactivated(() => {
    active = false
    release()
  })
  watch([enabled, () => theme.value.motion.pressScale], () => feedback?.refresh(), {
    flush: 'pre',
  })
  watch(() => surface?.(), bind, { flush: 'post' })
  onBeforeUnmount(release)
  return {
    onVnodeMounted: (vnode: VNode) => {
      element.value = vnode.el as HTMLElement
    },
    onVnodeBeforeUnmount: () => {
      element.value = null
      release()
    },
  }
}
