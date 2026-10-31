import type { View } from '@nativescript/core'

export interface KeyboardDismissal {
  tap: boolean
  drag: boolean
}
interface ScreenView {
  setKeyboardDismissal(onTap: boolean, onDrag: boolean): void
}

/** The container is a `com.mavis.ui.Screen`, which watches every touch of the page. */
export function dismissKeyboardOn(container: View, options: KeyboardDismissal): () => void {
  const screen = container.android as Partial<ScreenView> | undefined
  if (!screen?.setKeyboardDismissal) return () => {}
  screen.setKeyboardDismissal(options.tap, options.drag)
  return () => screen.setKeyboardDismissal?.(false, false)
}
