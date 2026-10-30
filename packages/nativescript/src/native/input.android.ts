import {
  EditableTextBase,
  editableProperty,
  type TextField,
  type TextView,
} from '@nativescript/core'

const applyEditable = (
  EditableTextBase.prototype as unknown as Record<symbol, (value: boolean) => void>
)[editableProperty.setNative]!

export function setInputEditable(view: TextField | TextView, editable: boolean) {
  applyEditable.call(view, editable)
  // Restoring a key listener alone does not restore focus in Android touch mode.
  view.android.setFocusable(editable)
  view.android.setFocusableInTouchMode(editable)
  view.android.setClickable(editable)
  view.android.setLongClickable(editable)
}

export function updateInputDescription(view: TextField | TextView) {
  // Core appends `text` to explicit labels, including secure text. EditText
  // already exposes its current value (or password masking) to the platform.
  view.android?.setContentDescription(
    [view.accessibilityLabel, view.accessibilityHint].filter(Boolean).join('. ') || null,
  )
}

export function writeInputText(view: TextField | TextView, write: () => void) {
  const filters = view.android.getFilters()
  // InputFilters also affect setText(). An external model must remain intact;
  // restore the user's editing limit immediately after the programmatic write.
  view.android.setFilters([])
  try {
    write()
  } finally {
    view.android.setFilters(filters)
  }
}
