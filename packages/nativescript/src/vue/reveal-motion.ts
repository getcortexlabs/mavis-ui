import { onBeforeUnmount } from 'nativescript-vue'
import type { View } from '@nativescript/core'
import { animate, set, onReducedMotion } from '@rafaelaugusto/jolt'
import { revealMotion } from '@getcortexlabs/mavis-core'

type Element = { nativeView: View }

/** Each transition owns its completion; an interrupted leave cannot finish a new entry. */
export function useRevealMotion() {
  const entered = new WeakSet<View>()
  const active = new Map<
    View,
    { handle: ReturnType<typeof animate>; phase: 'enter' | 'leave'; remove: () => void }
  >()
  const cancel = ({ nativeView: view }: Element) => {
    const operation = active.get(view)
    if (!operation) return
    active.delete(view)
    operation.remove()
    operation.handle.stop()
  }
  const run = (phase: 'enter' | 'leave') => (element: Element, done: () => void) => {
    const view = element.nativeView
    cancel(element)
    if (phase === 'enter' && !entered.has(view)) {
      entered.add(view)
      set(view, { opacity: revealMotion.enter[0].opacity[0], y: revealMotion.enter[0].y[0] })
    }
    const handle = animate(
      view,
      phase === 'enter' ? { opacity: 1, y: 0 } : revealMotion.leave[0],
      revealMotion[phase][1],
    )
    const unloaded = () => cancel(element)
    const operation = { handle, phase, remove: () => view.off('unloaded', unloaded) }
    active.set(view, operation)
    view.on('unloaded', unloaded)
    void handle.finished.then(() => {
      if (active.get(view) !== operation) return
      active.delete(view)
      operation.remove()
      done()
    })
  }
  const offPreference = onReducedMotion((reduced) => {
    if (reduced)
      for (const [view, operation] of active) {
        if (operation.phase === 'enter') set(view, { y: 0 })
      }
  })
  onBeforeUnmount(() => {
    offPreference()
    for (const view of active.keys()) cancel({ nativeView: view })
  })
  return {
    onEnter: run('enter'),
    onLeave: run('leave'),
    onEnterCancelled: cancel,
    onLeaveCancelled: cancel,
  }
}
