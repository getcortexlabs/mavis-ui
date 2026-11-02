import { createConfiguratorControls } from '@getcortexlabs/mavis-core/vue'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MInput } from './MInput.js'
import { MChip } from './MChip.js'
import { MCheckbox } from './MCheckbox.js'
import { MSheet } from './MSheet.js'
import { MColumn, MRow } from './layout.js'

export const { MNumberInput, MMultiSelect } = createConfiguratorControls(
  {
    Column: MColumn,
    Row: MRow,
    Text: MText,
    Button: MButton,
    Input: MInput,
    Chip: MChip,
    Checkbox: MCheckbox,
    Sheet: MSheet,
    focusTrigger: (component) =>
      (component as { $el?: HTMLElement } | undefined)?.$el?.focus({ preventScroll: true }),
  },
  'web',
)
