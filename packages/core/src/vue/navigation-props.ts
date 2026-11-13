import type { PropType } from '@vue/runtime-core'
import type { ChoiceValue } from '../choice.js'
import type { MenuItem, NavigationItem, VirtualItemKey } from '../collections.js'
import type { PopoverPlacement } from '../popover.js'
import type { HourCycle, LocalTime, TimeLocale } from '../time.js'
import { buttonProps, inputProps, spacingProp } from './props.js'

export const popoverProps = {
  id: inputProps.id,
  open: Boolean,
  label: { type: String, required: true as const },
  triggerLabel: { type: String, required: true as const },
  icon: buttonProps.icon,
  variant: { ...buttonProps.variant, default: 'secondary' },
  disabled: Boolean,
  placement: { type: String as PropType<PopoverPlacement>, default: 'bottom-start' },
  width: { type: Number, default: 280 },
  padding: { ...spacingProp, default: 'md' },
  /** Menu owns its keyboard behavior; ordinary popovers contain arbitrary controls. */
  role: { type: String as PropType<'dialog' | 'menu'>, default: 'dialog' },
}
export const menuProps = {
  ...popoverProps,
  items: { type: Array as PropType<readonly MenuItem[]>, required: true as const },
}
export const appBarProps = {
  id: inputProps.id,
  title: { type: String, required: true as const },
  subtitle: String,
  back: Boolean,
  backLabel: { type: String, default: 'Back' },
  /** Optional app-owned callback; otherwise uses the installed navigation service. */
  navigateBack: Function as PropType<() => void | Promise<unknown>>,
}
export const tabBarProps = {
  id: inputProps.id,
  label: { type: String, required: true as const },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  items: { type: Array as PropType<readonly NavigationItem[]>, required: true as const },
  disabled: Boolean,
  currentLabel: { type: String, default: 'Current page' },
  /** Web viewport inset; native MScreen already owns the safe area. */
  safeArea: { type: Boolean, default: false },
}
export const timePickerProps = {
  id: inputProps.id,
  label: inputProps.label,
  width: inputProps.width,
  grow: inputProps.grow,
  shrink: inputProps.shrink,
  modelValue: { type: String as PropType<LocalTime | null>, default: null },
  draft: { type: String, default: undefined },
  min: String,
  max: String,
  minuteStep: { type: Number, default: 1 },
  locale: { type: String as PropType<TimeLocale>, default: 'en-US' },
  hourCycle: String as PropType<HourCycle>,
  name: inputProps.name,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  helperText: inputProps.helperText,
  error: inputProps.error,
  placeholder: { type: String, default: undefined },
  chooseLabel: { type: String, default: 'Choose time' },
  confirmLabel: { type: String, default: 'Apply' },
  cancelLabel: { type: String, default: 'Cancel' },
  clearLabel: { type: String, default: 'Clear time' },
  hourLabel: { type: String, default: 'Hour' },
  minuteLabel: { type: String, default: 'Minute' },
  periodLabel: { type: String, default: 'Period' },
  invalidLabel: {
    type: String,
    default: 'Enter a valid time within the allowed range and interval.',
  },
}
export const virtualListProps = {
  id: inputProps.id,
  label: { type: String, required: true as const },
  items: { type: Array as PropType<readonly unknown[]>, required: true as const },
  itemKey: { type: [String, Function] as PropType<VirtualItemKey>, default: 'id' },
  rowHeight: { type: Number, required: true as const },
  height: { type: Number, required: true as const },
  overscan: { type: Number, default: 3 },
  initialIndex: { type: Number, default: 0 },
  /** Animate keyed data changes; scrolling and recycled rows never play entry motion. */
  animated: { type: Boolean, default: true },
  emptyLabel: { type: String, default: 'No items' },
}
