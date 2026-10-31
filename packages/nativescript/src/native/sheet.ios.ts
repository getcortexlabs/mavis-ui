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
  right: number
  bottom: number
  left: number
}
const windowInsets = (view: View): Insets | undefined =>
  (view.page?.ios as { view?: { safeAreaInsets?: Insets } } | undefined)?.view?.safeAreaInsets

/** The page lays its content inside the safe area; the host grows back over it with negative margins. */
export function expandLayerHost(host: View) {
  const insets = windowInsets(host)
  if (!insets) return
  if (host.marginTop !== -insets.top) host.marginTop = -insets.top
  if (host.marginRight !== -insets.right) host.marginRight = -insets.right
  if (host.marginBottom !== -insets.bottom) host.marginBottom = -insets.bottom
  if (host.marginLeft !== -insets.left) host.marginLeft = -insets.left
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

export function contentInsets(host: View): { left: number; right: number; bottom: number } {
  const insets = windowInsets(host)
  return {
    left: insets?.left ?? 0,
    right: insets?.right ?? 0,
    bottom: insets?.bottom ?? 0,
  }
}
