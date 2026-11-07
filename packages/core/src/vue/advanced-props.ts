import type { PropType } from '@vue/runtime-core'
import type {
  TreeSelectNode,
  MasonryItem,
  HeatmapValue,
  MavisNotification,
} from '../advanced-collections.js'
import type { ImageCrop, CropExportOptions } from '../image-crop.js'
import type { CivilDate } from '../date.js'
import type { SchedulerEvent, SchedulerDisambiguation } from '../scheduler.js'
import { spacingProp } from './props.js'
const label = { type: String, required: true as const },
  animated = { type: Boolean, default: true }
export const treeSelectProps = {
  id: String,
  label,
  nodes: { type: Array as PropType<readonly TreeSelectNode[]>, required: true as const },
  modelValue: { type: Array as PropType<readonly string[]>, default: () => [] },
  expanded: { type: Array as PropType<readonly string[]>, default: () => [] },
  multiple: Boolean,
  disabled: Boolean,
  animated,
  placeholder: { type: String, default: 'Choose items' },
  searchLabel: { type: String, default: 'Search' },
  clearLabel: { type: String, default: 'Clear selection' },
  emptyLabel: { type: String, default: 'No matches' },
  expandLabel: { type: String, default: 'Expand' },
  collapseLabel: { type: String, default: 'Collapse' },
}
export const masonryProps = {
  id: String,
  label,
  items: { type: Array as PropType<readonly MasonryItem[]>, required: true as const },
  minColumnWidth: { type: Number, default: 220 },
  columns: { type: Number, default: 4 },
  gap: { ...spacingProp, default: 'md' },
  animated,
  emptyLabel: { type: String, default: 'No items' },
}
export const heatmapProps = {
  id: String,
  label,
  start: { type: String as PropType<CivilDate>, required: true as const },
  end: { type: String as PropType<CivilDate>, required: true as const },
  values: { type: Array as PropType<readonly HeatmapValue[]>, required: true as const },
  modelValue: { type: String as PropType<CivilDate | null>, default: null },
  colors: {
    type: Array as PropType<readonly string[]>,
    default: () => ['#E6E4EB', '#C6ABCD', '#9B6AA9', '#704080', '#4C245C'],
  },
  cellSize: { type: Number, default: 40 },
  weekStartsOn: { type: Number as PropType<0 | 1>, default: 1 },
  animated,
  disabled: Boolean,
  missingLabel: { type: String, default: 'No data' },
  dataLabel: { type: String, default: 'View data' },
  lessLabel: { type: String, default: 'Less' },
  moreLabel: { type: String, default: 'More' },
  formatValue: Function as PropType<(value: number) => string>,
}
export const notificationCenterProps = {
  id: String,
  label,
  modelValue: { type: Array as PropType<readonly MavisNotification[]>, required: true as const },
  disabled: Boolean,
  animated,
  filter: { type: String as PropType<'all' | 'unread'>, default: 'all' },
  allLabel: { type: String, default: 'All' },
  unreadLabel: { type: String, default: 'Unread' },
  readLabel: { type: String, default: 'Mark as read' },
  unreadActionLabel: { type: String, default: 'Mark as unread' },
  readAllLabel: { type: String, default: 'Mark all as read' },
  dismissLabel: { type: String, default: 'Dismiss' },
  emptyLabel: { type: String, default: 'You are all caught up' },
  ungroupedLabel: { type: String, default: 'Notifications' },
}
export const imageCropperProps = {
  id: String,
  label,
  src: { type: String, required: true as const },
  modelValue: { type: Object as PropType<ImageCrop | null>, default: null },
  aspectRatio: { type: Number, default: 1 },
  animated,
  disabled: Boolean,
  output: {
    type: Object as PropType<CropExportOptions>,
    default: () => ({ mimeType: 'image/png', quality: 0.92 }),
  },
  zoomLabel: { type: String, default: 'Zoom' },
  rotateLabel: { type: String, default: 'Rotate clockwise' },
  resetLabel: { type: String, default: 'Reset' },
  exportLabel: { type: String, default: 'Export image' },
  loadingLabel: { type: String, default: 'Loading image' },
  moveLabel: { type: String, default: 'Move image' },
  leftLabel: { type: String, default: 'Move left' },
  rightLabel: { type: String, default: 'Move right' },
  upLabel: { type: String, default: 'Move up' },
  downLabel: { type: String, default: 'Move down' },
}
export const schedulerProps = {
  id: String,
  label,
  modelValue: { type: Array as PropType<readonly SchedulerEvent[]>, required: true as const },
  date: { type: String as PropType<CivilDate>, required: true as const },
  timeZone: { type: String, required: true as const },
  days: { type: Number as PropType<1 | 7>, default: 7 },
  startHour: { type: Number, default: 8 },
  endHour: { type: Number, default: 19 },
  slotMinutes: { type: Number, default: 15 },
  hourHeight: { type: Number, default: 80 },
  dayWidth: { type: Number, default: 180 },
  animated,
  disabled: Boolean,
  disambiguation: { type: String as PropType<SchedulerDisambiguation>, default: 'reject' },
  previousLabel: { type: String, default: 'Previous' },
  nextLabel: { type: String, default: 'Next' },
  moveLabel: { type: String, default: 'Move event' },
  resizeLabel: { type: String, default: 'Resize event' },
  earlierLabel: { type: String, default: 'Earlier' },
  laterLabel: { type: String, default: 'Later' },
  previousDayLabel: { type: String, default: 'Previous day' },
  nextDayLabel: { type: String, default: 'Next day' },
  shorterLabel: { type: String, default: 'Shorter' },
  longerLabel: { type: String, default: 'Longer' },
  emptyLabel: { type: String, default: 'No events' },
}
export const advancedCellProps = {
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, required: true as const },
  height: Number,
  measure: Boolean,
}
export const advancedCanvasProps = {
  height: { type: Number, required: true as const },
  width: Number,
}
export const advancedGestureProps = { label, disabled: Boolean }
export interface AdvancedGesture {
  phase: 'start' | 'move' | 'end' | 'cancel'
  x: number
  y: number
  scale: number
}
