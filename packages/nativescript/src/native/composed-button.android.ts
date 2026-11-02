import type { View } from '@nativescript/core'

declare const android: {
  view: {
    View: {
      OnKeyListener: new (listener: {
        onKey(
          view: unknown,
          key: number,
          event: {
            getAction(): number
            getRepeatCount(): number
            isCanceled(): boolean
          },
        ): boolean
      }) => unknown
      OnFocusChangeListener: new (listener: {
        onFocusChange(view: unknown, focused: boolean): void
      }) => unknown
    }
  }
}

/** A composed surface keeps a single Android keyboard/accessibility action. */
export function observeComposedButton(
  view: View,
  focus: (focused: boolean) => void,
  activate: () => void,
  press: (pressed: boolean) => void,
) {
  const button = view.android
  let down = false
  const cancel = () => {
    if (down) press(false)
    down = false
  }
  const keys = new android.view.View.OnKeyListener({
    onKey(_view, key, event) {
      if (![23, 62, 66].includes(key)) return false
      if (!view.isEnabled) {
        cancel()
        return false
      }
      if (event.getAction() === 0) {
        if (!event.getRepeatCount()) {
          down = true
          press(true)
        }
      } else if (event.getAction() === 1 && down) {
        const accepted = !event.isCanceled()
        cancel()
        if (accepted) activate()
      }
      return true
    },
  })
  const focused = new android.view.View.OnFocusChangeListener({
    onFocusChange(_view, value) {
      focus(value)
      if (!value) cancel()
    },
  })
  view.on('isEnabledChange', cancel)
  button.setDescendantFocusability(393216) // FOCUS_BLOCK_DESCENDANTS
  button.setFocusable(true)
  button.setOnKeyListener(keys)
  button.setOnFocusChangeListener(focused)
  return () => {
    cancel()
    view.off('isEnabledChange', cancel)
    button.setOnKeyListener(null)
    if (button.getOnFocusChangeListener() === focused) button.setOnFocusChangeListener(null)
  }
}
