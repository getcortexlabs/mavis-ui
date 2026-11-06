import { useComponentWidth } from '../component-width.js'
import {
  createChart,
  createCommandPalette,
  createWayfindingControls,
} from '@getcortexlabs/mavis-core/vue'
import type { View } from '@nativescript/core'
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
  focus: (component: unknown) =>
    (component as { $el?: { nativeView?: View } } | undefined)?.$el?.nativeView?.focus(),
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
export const { MNavigationRail, MBreadcrumb, MTimeline } = createWayfindingControls(ui, 'native')
export const MChart = createChart(ui, 'native')
export const MCommandPalette = createCommandPalette(
  {
    ...ui,
    focus: (component) =>
      (component as { $el?: { nativeView?: View } } | undefined)?.$el?.nativeView?.focus(),
  },
  'native',
)
