import { Utils, isAndroid, type View } from '@nativescript/core'
import { createDatePickers } from '@getcortexlabs/mavis-core/vue'
import { MInput } from './MInput.js'
import { MButton } from './MButton.js'
import { MColumn, MRow } from './layout.js'
import { MSheet } from './MSheet.js'
import { DateCalendar } from './DateCalendar.js'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'

function focusOpener(opener: unknown) {
  const view = (opener as { $el?: { nativeView?: View } } | undefined)?.$el?.nativeView
  view?.focus()
}

export const { MDatePicker, MDateRangePicker } = createDatePickers({
  Input: MInput,
  Button: MButton,
  Column: MColumn,
  Row: MRow,
  Sheet: MSheet,
  Calendar: DateCalendar,
  beforeOpen: (opener) => {
    Utils.dismissKeyboard()
    focusOpener(opener)
  },
  afterClose: (opener) => {
    const view = (opener as { $el?: { nativeView?: View } } | undefined)?.$el?.nativeView
    if (!view?.isLoaded) return
    view.focus()
    if (isAndroid) view.android.performAccessibilityAction(64, null)
    else notifyAccessibilityLayout(view)
  },
})
