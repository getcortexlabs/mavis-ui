import type { View } from '@nativescript/core'

export interface KeyboardDismissal {
  /** A tap anywhere on the page that is not an editor. */
  tap: boolean
  /** A drag of the scrolling content. */
  drag: boolean
}

// NativeScript resolves the platform implementation before loading this module.
/** Puts the software keyboard away for the given gestures until the returned function runs. */
export function dismissKeyboardOn(_container: View, _options: KeyboardDismissal): () => void {
  return () => {}
}
