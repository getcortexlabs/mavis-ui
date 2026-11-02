import type { EventData, TouchGestureEventData, View } from '@nativescript/core'
import { animate, stop, onReducedMotion } from '@rafaelaugusto/jolt'
import { pressMotion } from '@getcortexlabs/mavis-core'

let nextLayer = 0

/** Press multiplies the app's scale; releasing it removes only that contribution. */
export function attachPressFeedback(view: View, scale: number) {
  let motion = pressMotion(scale)
  // Each attachment owns its channel, including after a theme change or reload.
  const layer = `mavis-press-${++nextLayer}`
  let pressed = false
  let used = false
  let disposed = false

  const onTouch = (event: EventData) => {
    if (disposed) return
    const { action } = event as TouchGestureEventData
    if (action === 'down' && !pressed && view.isEnabled !== false) {
      pressed = true
      used = true
      animate(view, motion.pressed[0], { ...motion.pressed[1], layer })
    } else if ((action === 'up' || action === 'cancel') && pressed) {
      pressed = false
      animate(view, motion.released[0], { ...motion.released[1], layer })
    }
  }
  const remove = () => {
    if (disposed) return
    disposed = true
    offPreference()
    view.off('touch', onTouch)
    view.off('unloaded', remove)
    // A finished press can still hold its multiplier. stop(layer) also removes that rest.
    if (used) {
      stop(view, ['scale'], { layer })
    }
  }
  const offPreference = onReducedMotion((reduced) => {
    if (reduced && used && !disposed) {
      animate(view, motion[pressed ? 'pressed' : 'released'][0], { duration: 0, layer })
    }
  })
  view.on('touch', onTouch)
  view.on('unloaded', remove)
  return Object.assign(remove, {
    press(pressed: boolean) {
      onTouch({ action: pressed ? 'down' : 'cancel' } as TouchGestureEventData)
    },
    update(scale: number) {
      motion = pressMotion(scale)
      if (pressed && !disposed) animate(view, motion.pressed[0], { ...motion.pressed[1], layer })
    },
  })
}
