import type { View } from '@nativescript/core'

export interface BackPress {
  cancel: boolean
}

export function watchBack(_handler: (event: BackPress) => void): () => void {
  return () => {}
}

export function setModal(panel: View, modal: boolean) {
  const native = panel.ios as { accessibilityViewIsModal: boolean } | undefined
  if (native) native.accessibilityViewIsModal = modal
}

interface Insets {
  top: number
  bottom: number
}
const windowInsets = (view: View): Insets | undefined =>
  (view.page?.ios as { safeAreaInsets?: Insets } | undefined)?.safeAreaInsets

/** The page lays its content inside the safe area; the host grows back over it with negative margins. */
export function expandLayerHost(host: View) {
  const insets = windowInsets(host)
  if (!insets) return
  if (host.marginTop !== -insets.top) host.marginTop = -insets.top
  if (host.marginBottom !== -insets.bottom) host.marginBottom = -insets.bottom
}

/** Keeps the panel below the status bar; the panel itself pads its content above the home indicator. */
export function safeAreaOf(host: View): { readonly top: number; readonly bottom: number } {
  return {
    get top() {
      return windowInsets(host)?.top ?? 0
    },
    bottom: 0,
  }
}

export function bottomInset(host: View): number {
  return windowInsets(host)?.bottom ?? 0
}
