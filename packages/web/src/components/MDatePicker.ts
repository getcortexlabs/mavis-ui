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
  deferActions: true,
  openerAttrs: {
    // Safari does not focus buttons on pointer activation. Capture the actual trigger
    // before the Sheet snapshots focus; keyboard activation already has the right owner.
    onMousedown(event: MouseEvent) {
      if (event.button === 0) (event.currentTarget as HTMLElement).focus({ preventScroll: true })
    },
  },
  beforeOpen: focusOpener,
  // MSheet restores the Web opener after its close animation.
  afterClose: () => {},
})
