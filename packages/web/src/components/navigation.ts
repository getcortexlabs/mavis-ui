import { createMenu, createNavigationControls } from '@getcortexlabs/mavis-core/vue'
import { MPopover } from './MPopover.js'
import { MRow, MColumn, MBox } from './layout.js'
import { MButton } from './MButton.js'
import { MText } from './MText.js'
import { MBadge } from './MBadge.js'
import { MSeparator } from './MSeparator.js'

export const { MAppBar, MTabBar } = createNavigationControls(
  { Box: MBox, Row: MRow, Column: MColumn, Text: MText, Button: MButton, Badge: MBadge },
  'web',
)
export const MMenu = createMenu(
  { Popover: MPopover, Column: MColumn, Text: MText, Button: MButton, Separator: MSeparator },
  (input) => {
    const event = input as KeyboardEvent
    const root = event.currentTarget as HTMLElement
    const items = [...root.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')]
    const current = items.indexOf(document.activeElement as HTMLElement)
    let next = current
    if (event.key === 'ArrowDown') next = (current + 1) % items.length
    else if (event.key === 'ArrowUp') next = (current + items.length - 1) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key !== ' '
    ) {
      const order = [...items.slice(current + 1), ...items.slice(0, current + 1)]
      const match = order.find((item) =>
        (item.getAttribute('aria-label') ?? item.textContent ?? '')
          .trim()
          .toLocaleLowerCase()
          .startsWith(event.key.toLocaleLowerCase()),
      )
      if (match) next = items.indexOf(match)
    } else return
    event.preventDefault()
    items[next]?.focus()
  },
)
