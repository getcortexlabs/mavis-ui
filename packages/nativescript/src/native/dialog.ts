import type { View } from '@nativescript/core'
export interface DialogFocusViews {
  panel: View
  title: View
  cancel: View
  confirm: View
}
export function bindDialogFocus(_views: DialogFocusViews, _escape: () => void) {
  return { update(_loading: boolean) {}, dispose(_restore: boolean) {} }
}
