import type { View } from '@nativescript/core'

export interface BackPress {
  cancel: boolean
}

// NativeScript resolves the platform implementation before loading this module.
/** Android reports the back press before the sheet handles it; other platforms have none. */
export function watchBack(_handler: (event: BackPress) => void): () => void {
  return () => {}
}

/** iOS keeps VoiceOver inside a modal view; Android hides the covered content instead. */
export function setModal(_panel: View, _modal: boolean) {}

/** Safe-area insets around the sheet host, in DIPs; only iOS reports them. */
export function safeAreaOf(_host: View): { readonly top: number; readonly bottom: number } {
  return { top: 0, bottom: 0 }
}

/** Lets the layer host cover the whole window; only iOS insets it by default. */
export function expandLayerHost(_host: View) {}

export function bottomInset(_host: View): number {
  return 0
}
