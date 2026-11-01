import { TextField } from '@nativescript/core'
import { secureProperty } from '@nativescript/core/ui/text-field/text-field-common'
import { fontScaleInternalProperty } from '@nativescript/core/ui/styling/style-properties'
import { applyDynamicType } from './dynamic-type'

const setSecure = (TextField.prototype as unknown as Record<symbol, (value: boolean) => void>)[
  secureProperty.setNative
]!

/** Follows the system text size with the iOS body curve instead of Core's table. */
export class MavisTextField extends TextField {
  [secureProperty.setNative](value: boolean) {
    const field = this.ios
    const text = field.text
    const selection = field.selectedTextRange
    const start = selection
      ? field.offsetFromPositionToPosition(field.beginningOfDocument, selection.start)
      : null
    const end = selection
      ? field.offsetFromPositionToPosition(field.beginningOfDocument, selection.end)
      : null
    setSecure.call(this, value)
    if (field.isFirstResponder) {
      // Core treats the first secure keystroke as replacing the whole value. This is
      // an existing edit switching visibility, so its next keystroke must use the selection.
      const state = this as unknown as { _firstEdit: boolean }
      state._firstEdit = false
    }
    if (field.isFirstResponder && value && text) {
      // UIKit otherwise clears the secure buffer on the next insertion. Reinsert
      // the existing value without treating it as a new edit in Core's delegate.
      const delegate = field.delegate
      try {
        field.delegate = null
        field.text = ''
        field.insertText(text)
      } finally {
        field.delegate = delegate
      }
    } else {
      field.text = text
    }
    if (start !== null && end !== null) {
      const from = field.positionFromPositionOffset(field.beginningOfDocument, start)
      const to = field.positionFromPositionOffset(field.beginningOfDocument, end)
      if (from && to) field.selectedTextRange = field.textRangeFromPositionToPosition(from, to)
    }
  }

  [fontScaleInternalProperty.setNative]() {
    applyDynamicType(this)
  }
}
