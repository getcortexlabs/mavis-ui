import { createDatePickers } from '@getcortexlabs/mavis-core/vue'
import { MInput } from './MInput.js'
import { MButton } from './MButton.js'
import { MColumn, MRow } from './layout.js'
import { MSheet } from './MSheet.js'
import { DateCalendar } from './DateCalendar.js'

function focusOpener(opener: unknown) {
  const element = (opener as { $el?: HTMLElement } | undefined)?.$el
  element?.focus?.({ preventScroll: true })
}

export const { MDatePicker, MDateRangePicker } = createDatePickers({
  Input: MInput,
  Button: MButton,
  Column: MColumn,
  Row: MRow,
  Sheet: MSheet,
  Calendar: DateCalendar,
  beforeOpen: focusOpener,
  // MSheet restores the Web opener after its close animation.
  afterClose: () => {},
})
