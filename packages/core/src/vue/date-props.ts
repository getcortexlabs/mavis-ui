import type { ExtractPublicPropTypes, PropType } from '@vue/runtime-core'
import type { CivilDate, DateLocale, DateRange, DateRangeDraft, DateValidation } from '../date.js'
import { isCivilDate } from '../date.js'
import { dimensionProperty } from '../contracts.js'
import { vueProperty } from './contracts.js'
import { flexProps, viewProps } from './props.js'

const dateOptions = {
  min: { type: String as PropType<CivilDate>, default: undefined },
  max: { type: String as PropType<CivilDate>, default: undefined },
  unavailableDates: { type: Array as PropType<readonly CivilDate[]>, default: () => [] },
  locale: { type: String as PropType<DateLocale>, default: 'en-US' as const },
  firstDayOfWeek: { type: Number, default: undefined },
}
const common = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: vueProperty(dimensionProperty),
  ...dateOptions,
  label: { type: String, required: true as const },
  helperText: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: Boolean,
  readonly: Boolean,
  clearable: { type: Boolean, default: true },
  clearLabel: { type: String, default: undefined },
  calendarLabel: { type: String, default: undefined },
  closeLabel: { type: String, default: undefined },
  /** Deterministic empty calendar snapshot; never reads the clock. */
  initialMonth: { type: String, default: '2000-01' },
}
export const datePickerProps = {
  ...common,
  modelValue: { type: String as PropType<CivilDate | null>, default: null },
  name: { type: String, default: undefined },
}
export const dateRangePickerProps = {
  ...common,
  modelValue: {
    type: Object as PropType<DateRange>,
    default: (): DateRange => ({ start: null, end: null }),
  },
  startLabel: { type: String, default: undefined },
  endLabel: { type: String, default: undefined },
  startName: { type: String, default: undefined },
  endName: { type: String, default: undefined },
}
const editingEmits = {
  validityChange: (value: DateValidation) => typeof value.valid === 'boolean',
  focus: () => true,
  blur: () => true,
}
export const datePickerEmits = {
  ...editingEmits,
  'update:modelValue': (value: CivilDate | null) => value === null || isCivilDate(value),
  'update:draft': (value: string) => typeof value === 'string',
}
export const dateRangePickerEmits = {
  ...editingEmits,
  'update:modelValue': (value: DateRange) =>
    (value.start === null || isCivilDate(value.start)) &&
    (value.end === null || isCivilDate(value.end)),
  'update:draft': (value: DateRangeDraft) =>
    typeof value.start === 'string' && typeof value.end === 'string',
}
export type DatePickerProps = ExtractPublicPropTypes<typeof datePickerProps>
export type DateRangePickerProps = ExtractPublicPropTypes<typeof dateRangePickerProps>

/** @internal Shared themed calendar presentation contract. */
export const dateCalendarProps = {
  ...dateOptions,
  activeDate: { type: String as PropType<CivilDate>, required: true as const },
  selected: { type: String as PropType<CivilDate | null>, default: null },
  rangeStart: { type: String as PropType<CivilDate | null>, default: null },
  rangeEnd: { type: String as PropType<CivilDate | null>, default: null },
}
export const dateCalendarEmits = {
  select: (value: CivilDate) => isCivilDate(value),
  'update:activeDate': (value: CivilDate) => isCivilDate(value),
}
