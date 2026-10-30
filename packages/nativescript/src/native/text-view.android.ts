import {
  accessibilityLabelProperty,
  accessibilityHintProperty,
} from '@nativescript/core/accessibility/accessibility-properties'
import { TextView, editableProperty } from '@nativescript/core'
import { updateInputDescription, writeInputText, setInputEditable } from './input.android.js'

export class MavisTextView extends TextView {
  [editableProperty.setNative](value: boolean) {
    setInputEditable(this, value)
  }

  _setNativeText(reset = false) {
    writeInputText(this, () => super._setNativeText(reset))
  }

  onLoaded() {
    super.onLoaded()
    this.android.setImeOptions(this.android.getImeOptions() | 0x10000000) // IME_FLAG_NO_EXTRACT_UI
  }

  [accessibilityLabelProperty.setNative]() {
    updateInputDescription(this)
  }
  [accessibilityHintProperty.setNative]() {
    updateInputDescription(this)
  }
}
