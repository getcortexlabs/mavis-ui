import type { PropType } from '@vue/runtime-core'
import type { ChoiceValue } from '../choice.js'
import type { VirtualItemKey } from '../collections.js'
import type { CivilDate, DateRange } from '../date.js'
import type { DataColumn, DataSort, RangeValue, TreeNode } from '../discovery.js'
import { datePickerProps } from './date-props.js'
import { sliderProps } from './props.js'

const label = { type: String, required: true as const }
const keys = { type: Array as PropType<readonly ChoiceValue[]>, default: () => [] }
export const rangeSliderProps = {
  ...sliderProps,
  modelValue: { type: Array as unknown as PropType<RangeValue>, default: () => [0, 100] as const },
  lowerLabel: { type: String, default: 'Minimum' },
  upperLabel: { type: String, default: 'Maximum' },
  formatValue: Function as PropType<(value: number) => string>,
  readonly: Boolean,
}
export const ratingProps = {
  label,
  id: String,
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  step: { type: Number as PropType<1 | 0.5>, default: 1 },
  disabled: Boolean,
  readonly: Boolean,
  clearable: { type: Boolean, default: true },
  clearLabel: { type: String, default: 'Clear rating' },
  formatValue: Function as PropType<(value: number, max: number) => string>,
}
export const calendarProps = {
  id: String,
  label,
  mode: { type: String as PropType<'single' | 'range'>, default: 'single' },
  modelValue: { type: [String, Object] as PropType<CivilDate | DateRange | null>, default: null },
  min: datePickerProps.min,
  max: datePickerProps.max,
  unavailableDates: datePickerProps.unavailableDates,
  locale: datePickerProps.locale,
  firstDayOfWeek: datePickerProps.firstDayOfWeek,
  initialMonth: datePickerProps.initialMonth,
  disabled: Boolean,
  readonly: Boolean,
  invalidRangeLabel: { type: String, default: 'This range includes an unavailable date.' },
}
export const dataTableProps = {
  id: String,
  label,
  items: { type: Array as PropType<readonly Record<string, unknown>[]>, required: true as const },
  itemKey: {
    type: [String, Function] as PropType<VirtualItemKey<Record<string, unknown>>>,
    default: 'id',
  },
  columns: { type: Array as PropType<readonly DataColumn[]>, required: true as const },
  sort: { type: Object as PropType<DataSort | null>, default: null },
  selected: keys,
  selectable: Boolean,
  disabled: Boolean,
  loading: Boolean,
  rowDisabled: Function as PropType<(item: Record<string, unknown>) => boolean>,
  rowLabel: Function as PropType<(item: Record<string, unknown>) => string>,
  selectLabel: { type: String, default: 'Select' },
  selectAllLabel: { type: String, default: 'Select this page' },
  emptyLabel: { type: String, default: 'No results' },
  loadingLabel: { type: String, default: 'Loading results' },
}
export const treeViewProps = {
  id: String,
  label,
  nodes: { type: Array as PropType<readonly TreeNode[]>, required: true as const },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  expanded: keys,
  loadingKeys: keys,
  disabled: Boolean,
  emptyLabel: { type: String, default: 'No items' },
  loadingLabel: { type: String, default: 'Loading' },
  expandedLabel: { type: String, default: 'Expanded' },
  collapsedLabel: { type: String, default: 'Collapsed' },
}
export const carouselProps = {
  id: String,
  label,
  items: { type: Array as PropType<readonly unknown[]>, required: true as const },
  itemKey: { type: [String, Function] as PropType<VirtualItemKey>, default: 'id' },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  disabled: Boolean,
  loop: Boolean,
  previousLabel: { type: String, default: 'Previous slide' },
  nextLabel: { type: String, default: 'Next slide' },
  slideLabel: { type: String, default: 'Slide' },
  emptyLabel: { type: String, default: 'No slides' },
}
