import type { View } from '@nativescript/core'
import { press } from '@rafaelaugusto/jolt'

/** Own the effect so disabling or unloading a pressed control restores its scale. */
export function attachPressFeedback(view: View, scale: number): () => void {
  const { scaleX, scaleY } = view
  const remove = press(view, { scaleX: scaleX * scale, scaleY: scaleY * scale })
  return () => {
    remove()
    view.scaleX = scaleX
    view.scaleY = scaleY
  }
}
