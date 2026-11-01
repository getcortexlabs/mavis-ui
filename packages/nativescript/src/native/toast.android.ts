import { Application, type View } from '@nativescript/core'

export function toastReaderActive(): boolean {
  const manager = Application.android.context?.getSystemService('accessibility')
  return Boolean(manager?.isTouchExplorationEnabled())
}
export function announceToast(view: View, message: string) {
  if (view.isLoaded && toastReaderActive()) view.android?.announceForAccessibility(message)
}
