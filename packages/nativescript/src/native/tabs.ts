import type { View } from '@nativescript/core'
export function observeTab(
  _view: View,
  _focus: (focused: boolean) => void,
  _navigate: (key: string) => void,
) {
  return () => {}
}
