import type { PropType } from '@vue/runtime-core'
import type { ChoiceValue } from '../choice.js'
import type {
  BreadcrumbItem,
  CommandItem,
  NavigationGroup,
  TimelineItem,
  TimelineStatus,
} from '../wayfinding.js'
import type { ChartCategory, ChartSelection, ChartSeries } from '../chart.js'
import { buttonProps, sheetProps } from './props.js'
import type { PopoverPlacement } from '../popover.js'

const label = { type: String, required: true as const }
export const commandPaletteProps = {
  id: String,
  label,
  open: Boolean,
  items: { type: Array as PropType<readonly CommandItem[]>, required: true as const },
  query: { type: String, default: undefined },
  disabled: Boolean,
  loading: Boolean,
  /** Opt-in Cmd/Ctrl+K on Web, ignored in editable elements and other modal dialogs. */
  shortcut: Boolean,
  searchLabel: { type: String, default: 'Search commands' },
  placeholder: { type: String, default: 'What would you like to do?' },
  emptyLabel: { type: String, default: 'No matching commands' },
  loadingLabel: { type: String, default: 'Loading commands' },
  closeLabel: { type: String, default: 'Close commands' },
  returnFocus: sheetProps.returnFocus,
}
export const navigationRailProps = {
  id: String,
  label,
  groups: { type: Array as PropType<readonly NavigationGroup[]>, required: true as const },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  collapsed: Boolean,
  disabled: Boolean,
  collapsible: { type: Boolean, default: true },
  collapseLabel: { type: String, default: 'Collapse navigation' },
  expandLabel: { type: String, default: 'Expand navigation' },
  currentLabel: { type: String, default: 'Current page' },
}
export const breadcrumbProps = {
  id: String,
  label: { type: String, default: 'Breadcrumb' },
  items: { type: Array as PropType<readonly BreadcrumbItem[]>, required: true as const },
  maxItems: { type: Number, default: 4 },
  expandLabel: { type: String, default: 'Show full path' },
}
export const tooltipProps = {
  id: String,
  text: label,
  triggerLabel: label,
  icon: { ...buttonProps.icon, default: 'info' },
  variant: { ...buttonProps.variant, default: 'ghost' },
  disabled: Boolean,
  delay: { type: Number, default: 350 },
  placement: { type: String as PropType<PopoverPlacement>, default: 'top-start' },
}
export const timelineProps = {
  id: String,
  label,
  items: { type: Array as PropType<readonly TimelineItem[]>, required: true as const },
  emptyLabel: { type: String, default: 'No activity yet' },
  statusLabels: {
    type: Object as PropType<Record<TimelineStatus, string>>,
    default: () => ({
      complete: 'Complete',
      current: 'In progress',
      upcoming: 'Upcoming',
      error: 'Needs attention',
    }),
  },
}
export const chartProps = {
  id: String,
  label,
  description: String,
  categories: { type: Array as PropType<readonly ChartCategory[]>, required: true as const },
  series: { type: Array as PropType<readonly ChartSeries[]>, required: true as const },
  type: { type: String as PropType<'line' | 'bar'>, default: 'line' },
  domain: Array as unknown as PropType<readonly [number, number]>,
  height: { type: Number, default: 240 },
  modelValue: { type: Object as PropType<ChartSelection | null>, default: null },
  disabled: Boolean,
  hiddenSeries: { type: Array as PropType<readonly ChoiceValue[]>, default: () => [] },
  formatValue: Function as PropType<(value: number) => string>,
  showData: { type: Boolean, default: false },
  showDataLabel: { type: String, default: 'Show data' },
  hideDataLabel: { type: String, default: 'Hide data' },
  emptyLabel: { type: String, default: 'No chart data' },
  missingLabel: { type: String, default: 'No value' },
  clearLabel: { type: String, default: 'Clear selection' },
  categoryLabel: { type: String, default: 'Category' },
  seriesLabel: { type: String, default: 'Series' },
}
