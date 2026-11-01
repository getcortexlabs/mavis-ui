import type { View } from '@nativescript/core'

declare function UIAccessibilityIsVoiceOverRunning(): boolean
declare const UIAccessibilityAnnouncementNotification: number
declare function UIAccessibilityPostNotification(notification: number, argument: unknown): void

export function toastReaderActive() {
  return UIAccessibilityIsVoiceOverRunning()
}
export function announceToast(view: View, message: string) {
  if (view.isLoaded && toastReaderActive())
    UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, message)
}
