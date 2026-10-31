import { Application, type View } from '@nativescript/core'

export interface BackPress {
  cancel: boolean
}

export function watchBack(handler: (event: BackPress) => void): () => void {
  const event = Application.android.activityBackPressedEvent
  Application.android.on(event, handler)
  return () => Application.android.off(event, handler)
}

export function setModal(_panel: View, _modal: boolean) {}

/** The Android window keeps the page inside the system bars, so the host needs no insets. */
export function safeAreaOf(_host: View): { readonly top: number; readonly bottom: number } {
  return { top: 0, bottom: 0 }
}

export function expandLayerHost(_host: View) {}

export function contentInsets(_host: View): { left: number; right: number; bottom: number } {
  return { left: 0, right: 0, bottom: 0 }
}
