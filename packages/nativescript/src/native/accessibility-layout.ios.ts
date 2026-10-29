import type { View } from '@nativescript/core'

declare const UIAccessibilityLayoutChangedNotification: number
declare function UIAccessibilityPostNotification(notification: number, argument: unknown): void

export function notifyAccessibilityLayout(focused?: View) {
  // Preserve the current focus while VoiceOver refreshes its reading order.
  UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, focused?.ios ?? null)
}
