import { Application, type View } from '@nativescript/core'
import { onReducedMotion, type PointerFollow } from '@rafaelaugusto/jolt'

/** Publish Jolt's live state after its native load, preference and application handlers run. */
export function watchPointerAvailability(
  pointer: PointerFollow,
  region: View,
  changed?: (available: boolean) => void,
) {
  if (!changed) return Object.assign(() => {}, { notify() {} })
  let stopped = false,
    queued = false,
    previous: boolean | undefined
  const notify = () => {
    if (stopped || queued) return
    queued = true
    void Promise.resolve().then(() => {
      queued = false
      if (stopped) return
      const available = pointer.available
      if (available !== previous) changed((previous = available))
    })
  }
  const events = ['loaded', 'unloaded', 'layoutChanged', 'isEnabledChange', 'visibilityChange']
  for (const event of events) region.on(event, notify)
  region.style.on('visibilityChange', notify)
  Application.on(Application.suspendEvent, notify)
  Application.on(Application.resumeEvent, notify)
  const offReduced = onReducedMotion(notify)
  notify()
  return Object.assign(
    () => {
      if (stopped) return
      stopped = true
      for (const event of events) region.off(event, notify)
      region.style.off('visibilityChange', notify)
      Application.off(Application.suspendEvent, notify)
      Application.off(Application.resumeEvent, notify)
      offReduced()
      if (previous !== false) changed(false)
    },
    { notify },
  )
}
