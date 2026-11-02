import type { TextField } from '@nativescript/core'
declare const android: {
  view: { inputmethod: { BaseInputConnection: { getComposingSpanStart(text: unknown): number } } }
}

export function comboboxComposing(view: TextField | undefined): boolean {
  return Boolean(
    view?.android &&
    android.view.inputmethod.BaseInputConnection.getComposingSpanStart(view.android.getText()) >= 0,
  )
}
