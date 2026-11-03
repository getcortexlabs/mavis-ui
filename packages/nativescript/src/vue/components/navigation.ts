import { createMenu, createNavigationControls } from '@getcortexlabs/mavis-core/vue'
import { MPopover } from './MPopover.js'
import { MRow, MColumn } from './layout.js'
import { MButton } from './MButton.js'
import { MText } from './MText.js'
import { MBadge } from './MBadge.js'
import { MSeparator } from './MSeparator.js'

export const { MAppBar, MTabBar } = createNavigationControls(
  { Row: MRow, Column: MColumn, Text: MText, Button: MButton, Badge: MBadge },
  'native',
)
export const MMenu = createMenu({
  Popover: MPopover,
  Column: MColumn,
  Text: MText,
  Button: MButton,
  Separator: MSeparator,
})
