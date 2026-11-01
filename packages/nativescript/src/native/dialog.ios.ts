import type { View } from '@nativescript/core'
import { notifyAccessibilityLayout } from './accessibility-layout'
export interface DialogFocusViews {
  panel: View
  title: View
  cancel: View
  confirm: View
}
declare function UIAccessibilityFocusedElement(technology: string): unknown
declare const UIAccessibilityNotificationVoiceOverIdentifier: string
declare const UIAccessibilityLayoutChangedNotification: number
declare function UIAccessibilityPostNotification(notification: number, argument: unknown): void
export function bindDialogFocus(views: DialogFocusViews, _escape: () => void) {
  const previous = UIAccessibilityFocusedElement(UIAccessibilityNotificationVoiceOverIdentifier)
  notifyAccessibilityLayout(views.title)
  return {
    update(_loading: boolean) {},
    dispose(restore: boolean) {
      if (restore && previous)
        UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, previous)
    },
  }
}
