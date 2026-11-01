import type { EventData, TouchGestureEventData, View } from '@nativescript/core'
import { animate, stop } from '@rafaelaugusto/jolt'
import { pressMotion } from '@getcortexlabs/mavis-core'

let nextLayer = 0

/** Press multiplies the app's scale; releasing it removes only that contribution. */
export function attachPressFeedback(view: View, scale: number): () => void {
  const motion = pressMotion(scale)
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
    view.off('touch', onTouch)
    view.off('unloaded', remove)
    // A finished press can still hold its multiplier. stop(layer) also removes that rest.
    if (used) {
      // Jolt rc.1 can leave Android's presentation at the cancelled frame when the model
      // already equals the release target. A flat native track commits the neutral mix;
      // clearing it immediately leaves no playback and never takes over the app's base.
      const neutral = motion.released[0].scale
      animate(view, { scale: [neutral, neutral] }, { duration: 1, layer })
      stop(view, ['scale'], { layer })
    }
  }
  view.on('touch', onTouch)
  view.on('unloaded', remove)
  return remove
}
