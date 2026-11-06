import { useComponentWidth } from '../component-width.js'
import {
  createChart,
  createCommandPalette,
  createWayfindingControls,
} from '@getcortexlabs/mavis-core/vue'
import { MRow, MColumn, MBox } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MLink } from './MLink.js'
import { MIcon } from './MIcon.js'
import { MBadge } from './MBadge.js'
import { MSeparator } from './MSeparator.js'
import { MSheet } from './MSheet.js'
import { MInput } from './MInput.js'
import { MSelect } from './MSelect.js'
import { MReveal } from './MReveal.js'
import { ChartPlot } from './ChartPlot.js'
const ui = {
  railWidth: useComponentWidth,
  focus: (component: unknown) => (component as { $el?: HTMLElement } | undefined)?.$el?.focus(),
  Row: MRow,
  Column: MColumn,
  Box: MBox,
  Text: MText,
  Button: MButton,
  Link: MLink,
  Icon: MIcon,
  Badge: MBadge,
  Separator: MSeparator,
  Sheet: MSheet,
  Input: MInput,
  Select: MSelect,
  Reveal: MReveal,
  Plot: ChartPlot,
}
export const { MNavigationRail, MBreadcrumb, MTimeline } = createWayfindingControls(ui, 'web')
export const MChart = createChart(ui, 'web')
export const MCommandPalette = createCommandPalette(
  {
    ...ui,
    focus: (component) => (component as { $el?: HTMLElement } | undefined)?.$el?.focus(),
    shortcut: (callback, enabled) => {
      const handler = (event: KeyboardEvent) => {
        if (
          !enabled() ||
          event.defaultPrevented ||
          event.repeat ||
          event.isComposing ||
          event.altKey ||
          !(event.metaKey || event.ctrlKey) ||
          event.key.toLowerCase() !== 'k'
        )
          return
        const target = event.target as HTMLElement | null
        if (
          target?.closest(
            'input,textarea,select,[contenteditable=""],[contenteditable="true"],dialog[open],[role="dialog"]',
          )
        )
          return
        event.preventDefault()
        callback()
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    },
  },
  'web',
)
