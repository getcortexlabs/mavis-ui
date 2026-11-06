import type { PropType } from '@vue/runtime-core'
import type { KanbanCard, KanbanColumn, DonutSegment, SparklinePoint } from '../dashboard.js'
const label = { type: String, required: true as const }
const animated = { type: Boolean, default: true }
const colors = {
  type: Array as PropType<readonly string[]>,
  default: () => ['#9C5270', '#51847B', '#D5AD6C'],
}
export const kanbanProps = {
  id: String,
  label,
  columns: { type: Array as PropType<readonly KanbanColumn[]>, required: true as const },
  modelValue: { type: Array as PropType<readonly KanbanCard[]>, required: true as const },
  query: { type: String, default: '' },
  disabled: Boolean,
  animated,
  draggable: { type: Boolean, default: true },
  moveLabel: { type: String, default: 'Move card' },
  upLabel: { type: String, default: 'Move up' },
  downLabel: { type: String, default: 'Move down' },
  emptyLabel: { type: String, default: 'No cards' },
  fullLabel: { type: String, default: 'Column full' },
}
export const donutChartProps = {
  id: String,
  label,
  segments: { type: Array as PropType<readonly DonutSegment[]>, required: true as const },
  modelValue: { type: String as PropType<string | null>, default: null },
  size: { type: Number, default: 220 },
  strokeWidth: { type: Number, default: 12 },
  animated,
  animateNumber: Boolean,
  disabled: Boolean,
  totalLabel: { type: String, default: 'Total' },
  emptyLabel: { type: String, default: 'No data' },
  formatValue: Function as PropType<(value: number) => string>,
}
export const sparklineProps = {
  id: String,
  label,
  points: { type: Array as PropType<readonly SparklinePoint[]>, required: true as const },
  domain: Array as unknown as PropType<readonly [number, number]>,
  height: { type: Number, default: 64 },
  color: String,
  animated,
  showData: Boolean,
  dataLabel: { type: String, default: 'View data' },
  emptyLabel: { type: String, default: 'No data' },
  formatValue: Function as PropType<(value: number) => string>,
}
const background = {
  id: String,
  colors,
  height: { type: Number, default: 280 },
  radius: { type: String as PropType<'none' | 'sm' | 'md' | 'lg' | 'full'>, default: 'lg' },
}
export const gradientBackgroundProps = {
  ...background,
  angle: { type: Number, default: 130 },
  animated,
  active: Boolean,
  duration: { type: Number, default: 12000 },
}
export const particleFieldProps = {
  ...background,
  active: Boolean,
  density: { type: Number, default: 12 },
  speed: { type: Number, default: 28 },
  lifetime: { type: Number, default: 3000 },
  duration: Number,
  size: { type: Number, default: 3 },
  shape: { type: String as PropType<'circle' | 'rectangle' | 'ring'>, default: 'circle' },
  backgroundColor: { type: String, default: '#202A32' },
}
export const confettiProps = {
  id: String,
  colors,
  trigger: { type: [String, Number], default: 0 },
  count: { type: Number, default: 70 },
  disabled: Boolean,
}
export const dashboardEnvironmentProps = { interactive: Boolean }
export const dashboardPlotProps = { height: { type: Number, required: true as const } }
export const dashboardShapeProps = {
  d: { type: String, required: true as const },
  viewBox: {
    type: Array as unknown as PropType<readonly [number, number, number, number]>,
    required: true as const,
  },
  color: { type: String, required: true as const },
  strokeWidth: { type: Number, default: 2 },
  start: { type: Number, default: 0 },
  end: { type: Number, default: 1 },
  animated,
}
