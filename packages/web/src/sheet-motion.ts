import { createWebRuntime, type WebDrag, type WebAnimation } from '@rafaelaugusto/jolt/web'

/** One stable transform owner for entrance, handle input, release and dismissal. */
export function sheetMotion(
  dialog: HTMLDialogElement,
  panel: HTMLElement,
  handle: HTMLElement | null,
  dismissible: () => boolean,
  closed: () => void,
  swiped: () => void,
) {
  const view = panel.ownerDocument.defaultView!
  const abort = new view.AbortController()
  const runtime = createWebRuntime(panel.ownerDocument)
  let gesture: WebDrag | undefined
  let playback: WebAnimation | undefined
  let height = panel.offsetHeight
  let open = true
  let disposed = false
  let generation = 0
  let contact: number | undefined
  const listen = (target: EventTarget, event: string, listener: EventListener, capture = false) =>
    target.addEventListener(event, listener, { signal: abort.signal, capture, passive: true })

  const play = () => {
    const current = ++generation
    gesture?.cancel()
    const animation = runtime.animate(
      panel,
      { y: open ? 0 : height },
      { type: 'spring', duration: 420, bounce: 0 },
    )
    playback = animation
    void animation.finished.then((finished) => {
      if (finished && !disposed && generation === current && !open) closed()
    })
  }
  // Jolt owns recognition/capture/velocity. Gate its input to the dedicated handle using
  // its supported disabled state, leaving pointer events and scrolling in the body intact.
  listen(
    panel,
    'pointerdown',
    ((event: PointerEvent) => {
      const allowed = Boolean(open && dismissible() && handle?.contains(event.target as Node))
      gesture?.update({ disabled: !allowed })
      if (allowed && event.isPrimary && event.button === 0) contact = event.pointerId
    }) as EventListener,
    true,
  )
  // Safari otherwise focuses the non-focusable handle's ancestor and scrolls the
  // underlying Screen. Preserve the current modal focus without cancelling pointer input.
  handle?.addEventListener('mousedown', (event) => event.preventDefault(), {
    signal: abort.signal,
  })

  const attach = () => {
    gesture?.dispose()
    gesture = handle
      ? runtime.drag(panel, {
          axis: 'y',
          bounds: { top: 0, bottom: height },
          snap: { y: [0, height] },
          spring: { duration: 420, bounce: 0 },
          disabled: !open || !dismissible(),
        })
      : undefined
    // Only the handle reserves vertical input. A scrollable body keeps browser scrolling.
    panel.style.touchAction = 'auto'
  }
  const viewport = () => {
    const visual = view.visualViewport
    if (visual && visual.scale !== 1) return
    const available = visual?.height ?? view.innerHeight
    dialog.style.setProperty('--m-sheet-viewport-height', `${available}px`)
    dialog.style.bottom = `${Math.max(0, view.innerHeight - available - (visual?.offsetTop ?? 0))}px`
  }
  const resize = () => {
    if (disposed) return
    viewport()
    const next = panel.offsetHeight
    if (Math.abs(next - height) < 1) return
    height = next
    contact = undefined
    attach()
    play()
  }
  viewport()
  height = panel.offsetHeight
  // Transform origin stays at 0 0, so geometry changes do not require pivot rebasing.
  runtime.set(panel, { y: height })
  attach()
  listen(view, 'pointerup', ((event: PointerEvent) => {
    if (contact !== event.pointerId) return
    contact = undefined
    const animation = gesture?.animation
    if (!animation) return
    const current = ++generation
    void animation.finished.then((finished) => {
      if (!finished || disposed || current !== generation || !open || !dismissible()) return
      // A single read at completion; no per-frame subscription or second motion clock.
      const matrix = new view.DOMMatrixReadOnly(view.getComputedStyle(panel).transform)
      if (Math.abs(matrix.m42 - height) < 1) swiped()
    })
  }) as EventListener)
  const cancelled = (event?: Event) => {
    if (event && 'pointerId' in event && event.pointerId !== contact) return
    if (contact === undefined) return
    contact = undefined
    if (open) play()
  }
  for (const type of ['pointercancel', 'lostpointercapture']) listen(view, type, cancelled)
  listen(view, 'blur', cancelled)
  listen(panel.ownerDocument, 'visibilitychange', () => {
    if (panel.ownerDocument.hidden) cancelled()
  })
  listen(view, 'resize', resize)
  if (view.visualViewport) {
    listen(view.visualViewport, 'resize', resize)
    listen(view.visualViewport, 'scroll', resize)
  }
  const observer = new view.ResizeObserver(resize)
  observer.observe(panel)
  return {
    show() {
      open = true
      play()
    },
    hide() {
      open = false
      contact = undefined
      gesture?.update({ disabled: true })
      play()
    },
    refresh() {
      gesture?.update({ disabled: !open || !dismissible() })
      if (!dismissible()) {
        contact = undefined
        play()
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      generation++
      abort.abort()
      observer.disconnect()
      gesture?.dispose()
      playback?.stop()
      runtime.dispose()
    },
  }
}
