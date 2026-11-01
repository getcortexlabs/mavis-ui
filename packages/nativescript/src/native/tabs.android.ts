import type { View } from '@nativescript/core'

declare const android: {
  view: {
    View: {
      OnFocusChangeListener: new (listener: {
        onFocusChange(view: unknown, focused: boolean): void
      }) => unknown
      OnKeyListener: new (listener: {
        onKey(
          view: unknown,
          key: number,
          event: {
            getAction(): number
            isAltPressed(): boolean
            isCtrlPressed(): boolean
            isMetaPressed(): boolean
          },
        ): boolean
      }) => unknown
    }
  }
}

export function observeTab(
  view: View,
  focus: (focused: boolean) => void,
  navigate: (key: string) => void,
) {
  const button = view.android
  const focused = new android.view.View.OnFocusChangeListener({
    onFocusChange: (_view, value) => focus(value),
  })
  const keys = new android.view.View.OnKeyListener({
    onKey(_view, key, event) {
      if (
        event.getAction() !== 0 ||
        event.isAltPressed() ||
        event.isCtrlPressed() ||
        event.isMetaPressed()
      )
        return false
      const name = (
        { 21: 'ArrowLeft', 22: 'ArrowRight', 122: 'Home', 123: 'End' } as Record<number, string>
      )[key]
      if (!name) return false
      navigate(name)
      return true
    },
  })
  button.setOnFocusChangeListener(focused)
  button.setOnKeyListener(keys)
  // Preserve Android's default touch focus: forcing it would consume the first tap.
  return () => {
    if (button.getOnFocusChangeListener() === focused) button.setOnFocusChangeListener(null)
    button.setOnKeyListener(null)
  }
}
