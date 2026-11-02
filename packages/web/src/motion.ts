import {
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  shallowRef,
  watch,
  type Ref,
  type VNode,
} from 'vue'
import type { WebRuntime } from '@rafaelaugusto/jolt/web'
import { pressMotion, type MavisTheme } from '@getcortexlabs/mavis-core'
import { bindMotionSurface, type MotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { webMotionSurface } from './motion-surface.js'
import { useMotionContext } from './motion-context.js'

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
  let geometry: ReturnType<WebRuntime['observeGeometry']> | undefined
  const releaseGeometry = () => {
    geometry?.dispose()
    geometry = undefined
  }
  const observeGeometry = () => {
    if (geometry) return
    // Claim only a fresh surface; later geometry changes keep its channels and clocks.
    if (!used) runtime.set(target, { scale: 1 })
    geometry = runtime.observeGeometry(target)
  }
  if (applicationSurface()) observeGeometry()
  const blocked = () => !enabled() || Boolean(target.closest('[inert], [aria-disabled="true"]'))
  const apply = () => {
    const recipe = pressMotion(scale())[pressed ? 'pressed' : 'released']
    observeGeometry()
    used = true
    const handle = runtime.animate(target, recipe[0], { ...recipe[1], layer })
    playback = handle
    if (!pressed)
      void handle.finished.then((finished) => {
        if (!finished || disposed || pressed || playback !== handle || applicationSurface()) return
        releaseGeometry()
        runtime.release(target)
        used = false
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
    observeGeometry,
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
            releaseGeometry()
          }
        }
      } else if (pressed) apply()
    },
    dispose() {
      disposed = true
      abort.abort()
      if (used && target.isConnected) runtime.animate(target, { scale: 1 }, { duration: 0, layer })
      releaseGeometry()
    },
  }
}

export function usePressFeedback(
  enabled: () => boolean,
  theme: Readonly<Ref<MavisTheme>>,
  surface?: () => MotionSurface | undefined,
  motionEnabled: () => boolean = enabled,
) {
  const element = shallowRef<HTMLElement | null>(null)
  const context = useMotionContext()
  let lease: ReturnType<typeof context.acquire> | undefined
  let attached: HTMLElement | undefined
  let runtime: WebRuntime | undefined
  let feedback: ReturnType<typeof attachWebPress> | undefined
  let unbind: (() => void) | undefined
  let application: ReturnType<typeof webMotionSurface> | undefined
  const release = () => {
    const cleanup = unbind,
      press = feedback,
      host = runtime,
      target = attached,
      ownership = lease
    unbind = undefined
    application = undefined
    feedback = undefined
    attached = undefined
    lease = undefined
    runtime = undefined
    const errors: unknown[] = []
    for (const dispose of [
      cleanup,
      () => press?.dispose(),
      () => {
        if (target) host?.release(target)
      },
      () => ownership?.release(),
    ]) {
      try {
        dispose?.()
      } catch (error) {
        errors.push(error)
      }
    }
    if (errors.length) throw new AggregateError(errors, 'Web motion presentation cleanup failed.')
  }
  const bind = () => {
    unbind?.()
    unbind = undefined
    const target = element.value
    const current = runtime
    if (target && current && surface?.()) {
      try {
        feedback?.observeGeometry()
        application = webMotionSurface(current, target, motionEnabled)
        unbind = bindMotionSurface(surface()!, application.adapter)
      } catch (error) {
        release()
        throw error
      }
    }
  }
  const attach = () => {
    const target = element.value
    if (!target || runtime) return
    lease = context.acquire(target.ownerDocument)
    runtime = lease.runtime
    attached = target
    try {
      feedback = attachWebPress(
        target,
        runtime,
        enabled,
        () => theme.value.motion.pressScale,
        () => Boolean(surface?.()),
      )
      bind()
    } catch (error) {
      release()
      throw error
    }
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
  watch(motionEnabled, () => application?.refresh(), { flush: 'sync' })
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
