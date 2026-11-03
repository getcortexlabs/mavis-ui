import { Utils } from '@nativescript/core'
import { createDatePickers } from '@getcortexlabs/mavis-core/vue'
import { MInput } from './MInput.js'
import { MButton } from './MButton.js'
import { MColumn, MRow } from './layout.js'
import { MSheet } from './MSheet.js'
import { DateCalendar } from './DateCalendar.js'

function focusOpener(opener: unknown) {
  ;(opener as { focusAction?: () => void } | undefined)?.focusAction?.()
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
  afterClose: focusOpener,
})
