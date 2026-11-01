import { Application, type View } from '@nativescript/core'
import { animate, set, onReducedMotion, reducedMotion } from '@rafaelaugusto/jolt'
import { progressMotion } from '@getcortexlabs/mavis-core'

/** The fill is private to Progress; only its translation is animated. */
export function attachProgressMotion(track: View, fill: View, indeterminate: boolean) {
  let motion: ReturnType<typeof animate> | undefined
  let pending: ReturnType<typeof setTimeout> | undefined
  let suspended = Application.suspended
  let disposed = false
  let previous = ''

  function stop() {
    motion?.stop()
    motion = undefined
  }
  function apply() {
    pending = undefined
    if (disposed) return
    const measured = track.getActualSize().width
    const width = Number.isFinite(measured) ? measured : 0
    const reduced = reducedMotion()
    const key = `${indeterminate}/${width}/${reduced}/${suspended}`
    if (key === previous) return
    previous = key
    stop()
    const travel = Math.max(0, width * (1 - progressMotion.segment))
    set(fill, { x: indeterminate && reduced ? travel / 2 : 0 })
    if (indeterminate && !reduced && !suspended && width > 0) {
      motion = animate(
        fill,
        { x: [0, travel, 0] },
        {
          duration: progressMotion.duration,
          ease: 'easeInOut',
          repeat: Infinity,
        },
      )
    }
  }
  function schedule() {
    if (disposed) return
    clearTimeout(pending)
    // Native styles finish syncing after loaded and after a mode change.
    pending = setTimeout(apply, 0)
  }
  function suspend() {
    suspended = true
    clearTimeout(pending)
    apply()
  }
  function resume() {
    suspended = false
    schedule()
  }
  const offMotion = onReducedMotion(schedule)
  track.on('layoutChanged', schedule)
  Application.on(Application.suspendEvent, suspend)
  Application.on(Application.resumeEvent, resume)
  schedule()
  return {
    update(value: boolean) {
      indeterminate = value
      schedule()
    },
    dispose() {
      if (disposed) return
      disposed = true
      clearTimeout(pending)
      stop()
      set(fill, { x: 0 })
      offMotion()
      track.off('layoutChanged', schedule)
      Application.off(Application.suspendEvent, suspend)
      Application.off(Application.resumeEvent, resume)
    },
  }
}
