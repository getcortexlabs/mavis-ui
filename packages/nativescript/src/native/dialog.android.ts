import type { View } from '@nativescript/core'
export interface DialogFocusViews {
  panel: View
  title: View
  cancel: View
  confirm: View
}
declare const android: {
  view: {
    View: {
      OnKeyListener: new (handler: {
        onKey(
          view: unknown,
          code: number,
          event: { getAction(): number; isShiftPressed(): boolean },
        ): boolean
      }) => unknown
    }
  }
}
export function bindDialogFocus(views: DialogFocusViews, escape: () => void) {
  const panel = views.panel.android
  const cancel = views.cancel.android
  const confirm = views.confirm.android
  const previous = panel.getRootView().findFocus()
  let busy = false
  // Touch-focusable buttons consume their first tap to focus instead of clicking.
  // Only the busy panel needs that behavior; buttons retain Android's defaults.
  panel.setFocusableInTouchMode(true)
  const listener = new android.view.View.OnKeyListener({
    onKey(view, code, event) {
      if (event.getAction() !== 0) return false
      if (code === 111) {
        escape()
        return true
      }
      if (code !== 61) return false
      if (busy) panel.requestFocus()
      else if (view === cancel) confirm.requestFocus()
      else if (view === confirm) cancel.requestFocus()
      else (event.isShiftPressed() ? confirm : cancel).requestFocus()
      return true
    },
  })
  for (const view of [panel, cancel, confirm]) view.setOnKeyListener(listener)
  return {
    update(loading: boolean) {
      busy = loading
      ;(loading ? panel : cancel).requestFocus()
    },
    dispose(restore: boolean) {
      for (const view of [panel, cancel, confirm]) view.setOnKeyListener(null)
      if (restore && previous?.isAttachedToWindow()) previous.requestFocus()
    },
  }
}
