import { Application, type View } from '@nativescript/core'
import { animate, set, onReducedMotion, reducedMotion } from '@rafaelaugusto/jolt'
import { segmentedMotion } from '@getcortexlabs/mavis-core'

interface SegmentBounds {
  key: string
  x: number
  width: number
  height: number
}

/** The marker belongs to the control; application transforms are never animated. */
export function attachSegmentedIndicator(indicator: View, read: () => SegmentBounds | undefined) {
  let motion: ReturnType<typeof animate> | undefined
  let pending: ReturnType<typeof setTimeout> | undefined
  let previous: SegmentBounds | undefined
  let animateNext = false
  let suspended = Application.suspended
  let disposed = false
  function stop() {
    motion?.stop()
    motion = undefined
  }
  function apply() {
    pending = undefined
    if (disposed) return
    const next = read()
    if (
      !next ||
      ![next.x, next.width, next.height].every(Number.isFinite) ||
      next.width <= 0 ||
      next.height <= 0
    ) {
      stop()
      indicator.opacity = 0
      previous = undefined
      animateNext = false
      return
    }
    const changed =
      !previous ||
      next.x !== previous.x ||
      next.width !== previous.width ||
      next.height !== previous.height
    if (changed || suspended || reducedMotion()) {
      stop()
      indicator.width = next.width
      indicator.height = next.height
      indicator.opacity = 1
      if (previous && previous.key !== next.key && animateNext && !suspended && !reducedMotion())
        motion = animate(
          indicator,
          { x: next.x },
          { duration: segmentedMotion.duration, ease: segmentedMotion.ease },
        )
      else set(indicator, { x: next.x })
    }
    previous = next
    animateNext = false
  }
  function update(animated = false) {
    if (disposed) return
    animateNext ||= animated
    if (pending === undefined) pending = setTimeout(apply, 0)
  }
  function suspend() {
    suspended = true
    clearTimeout(pending)
    apply()
  }
  function resume() {
    suspended = false
    update()
  }
  const offMotion = onReducedMotion(() => {
    stop()
    previous = undefined
    update()
  })
  Application.on(Application.suspendEvent, suspend)
  Application.on(Application.resumeEvent, resume)
  update()
  return {
    update,
    dispose() {
      if (disposed) return
      disposed = true
      clearTimeout(pending)
      stop()
      offMotion()
      Application.off(Application.suspendEvent, suspend)
      Application.off(Application.resumeEvent, resume)
    },
  }
}
