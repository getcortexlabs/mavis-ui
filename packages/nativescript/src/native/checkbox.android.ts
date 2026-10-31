import type { View } from '@nativescript/core'
import { SDK_VERSION } from '@nativescript/core/utils/constants'

declare const android: {
  view: {
    View: {
      OnFocusChangeListener: new (listener: {
        onFocusChange(view: unknown, focused: boolean): void
      }) => object
    }
  }
}

export function mixedValue(indeterminate: boolean, label: string) {
  return indeterminate && SDK_VERSION < 30 ? label : ''
}

export function observeCheckbox(view: View, focus: (focused: boolean) => void) {
  const button = view.android
  const listener = new android.view.View.OnFocusChangeListener({
    onFocusChange: (_view: unknown, focused: boolean) => focus(focused),
  })
  button.setOnFocusChangeListener(listener)
  focus(button.hasFocus())
  return {
    setMixed(label: string | undefined) {
      if (SDK_VERSION >= 30) button.setStateDescription(label ?? null)
    },
    dispose() {
      if (button.getOnFocusChangeListener() === listener) button.setOnFocusChangeListener(null)
      if (SDK_VERSION >= 30) button.setStateDescription(null)
      focus(false)
    },
  }
}
