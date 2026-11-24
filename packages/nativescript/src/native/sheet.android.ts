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

declare const android: {
  graphics: { Rect: new () => { top: number; bottom: number; height(): number } }
}

/** Reveal the focused editor after the compact sheet has given the scroll view its new height. */
export function revealSheetFocus(view: View) {
  const viewport = view.android
  const focused = viewport?.findFocus()
  if (!focused || focused === viewport || !viewport.getHeight()) return
  const bounds = new android.graphics.Rect()
  focused.getDrawingRect(bounds)
  if (bounds.height() > viewport.getHeight()) focused.getFocusedRect(bounds)
  viewport.offsetDescendantRectToMyCoords(focused, bounds)
  const top = viewport.getScrollY()
  const bottom = top + viewport.getHeight()
  if (bounds.bottom > bottom) viewport.scrollBy(0, bounds.bottom - bottom)
  else if (bounds.top < top) viewport.scrollBy(0, bounds.top - top)
}
