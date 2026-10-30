import {
  accessibilityLabelProperty,
  accessibilityHintProperty,
} from '@nativescript/core/accessibility/accessibility-properties'
import { TextField, returnKeyTypeProperty, editableProperty } from '@nativescript/core'
import { updateInputDescription, writeInputText, setInputEditable } from './input.android.js'

declare const android: {
  view: { inputmethod: { BaseInputConnection: { getComposingSpanStart(text: unknown): number } } }
}
const NO_EXTRACT_UI = 0x10000000
const setReturnKey = (TextField.prototype as unknown as Record<symbol, (value: string) => void>)[
  returnKeyTypeProperty.setNative
]!
interface KeyEvent {
  getKeyCode(): number
  getAction(): number
}

/** Keep editing in the screen and let the application own focus after submit. */
export class MavisTextField extends TextField {
  [editableProperty.setNative](value: boolean) {
    setInputEditable(this, value)
  }

  _setNativeText(reset = false) {
    writeInputText(this, () => super._setNativeText(reset))
  }

  [accessibilityLabelProperty.setNative]() {
    updateInputDescription(this)
  }
  [accessibilityHintProperty.setNative]() {
    updateInputDescription(this)
  }

  onLoaded() {
    super.onLoaded()
    this.android.setImeOptions(this.android.getImeOptions() | NO_EXTRACT_UI)
  }

  [returnKeyTypeProperty.setNative](value: string) {
    setReturnKey.call(this, value)
    this.android.setImeOptions(this.android.getImeOptions() | NO_EXTRACT_UI)
  }

  onEditorAction(_view: unknown, action: number, event: KeyEvent | null) {
    const enter = event?.getKeyCode() === 66
    // Android sends both down and up for a hardware Enter key.
    if (event && (!enter || event.getAction() !== 1)) return Boolean(enter)
    // IME actions: unspecified, go, search, send, next and done.
    if (!enter && ![0, 2, 3, 4, 5, 6].includes(action)) return false
    if (
      android.view.inputmethod.BaseInputConnection.getComposingSpanStart(this.android.getText()) >=
      0
    )
      return true
    this.notify({ eventName: TextField.returnPressEvent, object: this })
    return true
  }
}
