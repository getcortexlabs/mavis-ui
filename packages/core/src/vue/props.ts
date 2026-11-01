import type { ExtractPropTypes, ExtractPublicPropTypes, PropType } from '@vue/runtime-core'
import type { Palette, Spacing, Radius } from '../theme/types.js'
import { isChoiceValue, type ChoiceValue, type ChoiceOption } from '../choice.js'
import type { ToastController } from '../toast.js'
import type { Dimension } from '../layout.js'
import { iconSizes, type IconName, type IconSize } from '../icon.js'
import { sheetCloseReasons, type SheetCloseReason } from '../sheet.js'

function choice<T extends string>(values: readonly T[], defaultValue: T) {
  return {
    type: String as unknown as PropType<T>,
    default: defaultValue,
    validator: (value: T) => values.includes(value),
  }
}

export const spacingProp = { type: [String, Number] as PropType<Spacing>, default: undefined }
const radiusProp = { type: [String, Number] as PropType<Radius | number>, default: undefined }
const dimensionProp = { type: [Number, String] as PropType<Dimension>, default: undefined }

export const viewProps = {
  id: { type: String, default: undefined },
  accessibilityLabel: { type: String, default: undefined },
  accessibilityHidden: { type: Boolean, default: undefined },
}

export function viewAttrs(props: ExtractPropTypes<typeof viewProps>) {
  return {
    id: props.id,
    accessibilityLabel: props.accessibilityLabel,
    accessibilityHidden: props.accessibilityHidden,
  }
}

export const flexProps = {
  grow: { type: Number, default: 0 },
  shrink: { type: Number, default: undefined },
}
export const boxProps = {
  ...viewProps,
  ...flexProps,
  padding: spacingProp,
  paddingX: spacingProp,
  paddingY: spacingProp,
  radius: radiusProp,
  width: dimensionProp,
  height: dimensionProp,
  backgroundColor: String,
}
export type Align = 'start' | 'center' | 'end' | 'stretch'
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

function layoutProps(direction: 'row' | 'column') {
  return {
    ...boxProps,
    gap: spacingProp,
    align: choice<Align>(
      ['start', 'center', 'end', 'stretch'],
      direction === 'row' ? 'center' : 'stretch',
    ),
    justify: choice<Justify>(['start', 'center', 'end', 'between', 'around'], 'start'),
    wrap: Boolean,
  }
}
export const rowProps = layoutProps('row')
export const columnProps = layoutProps('column')
export const cardProps = {
  ...boxProps,
  padding: { ...spacingProp, default: 'lg' },
  radius: { ...radiusProp, default: 'lg' },
  gap: spacingProp,
  interactive: Boolean,
  disabled: Boolean,
}
export const buttonProps = {
  ...viewProps,
  ...flexProps,
  text: { type: String, default: undefined },
  variant: choice(['primary', 'secondary', 'ghost'] as const, 'primary'),
  size: choice(['sm', 'md', 'lg'] as const, 'md'),
  disabled: Boolean,
  loading: Boolean,
  loadingText: { type: String, default: 'Loading…' },
  icon: { type: String as PropType<IconName>, default: undefined },
  trailingIcon: { type: String as PropType<IconName>, default: undefined },
}
const tones: readonly (keyof Palette)[] = [
  'background',
  'surface',
  'elevated',
  'text',
  'muted',
  'primary',
  'onPrimary',
  'primarySoft',
  'accent',
  'onAccent',
  'accentSoft',
  'border',
  'warning',
  'success',
  'danger',
]
export const textProps = {
  ...viewProps,
  ...flexProps,
  text: { type: String, default: undefined },
  as: choice(['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const, 'p'),
  variant: choice(['display', 'title', 'heading', 'body', 'caption', 'overline'] as const, 'body'),
  tone: choice<keyof Palette>(tones, 'text'),
  align: choice(['left', 'center', 'right'] as const, 'left'),
  wrap: { type: Boolean, default: true },
}
export const sliderProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: Boolean,
  label: { type: String, required: true as const },
}
const booleanControlProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  modelValue: Boolean,
  label: { type: String, required: true as const },
  helperText: { type: String, default: '' },
  disabled: Boolean,
}
export const switchProps = booleanControlProps
export const switchEmits = { 'update:modelValue': (value: boolean) => typeof value === 'boolean' }
export const checkboxProps = {
  ...booleanControlProps,
  indeterminate: Boolean,
  indeterminateLabel: { type: String, default: 'Partially selected' },
}
export const checkboxEmits = {
  'update:modelValue': (value: boolean) => typeof value === 'boolean',
  'update:indeterminate': (value: boolean) => typeof value === 'boolean',
}
export const radioGroupProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  options: { type: Array as PropType<readonly ChoiceOption[]>, required: true as const },
  label: { type: String, required: true as const },
  helperText: { type: String, default: '' },
  disabled: Boolean,
}
export const radioGroupEmits = { 'update:modelValue': (value: ChoiceValue) => isChoiceValue(value) }
export const toastProps = {
  controller: { type: Object as PropType<ToastController>, required: true as const },
  closeLabel: { type: String, default: 'Dismiss notification' },
}

export const selectProps = {
  ...radioGroupProps,
  placeholder: { type: String, default: 'Select an option' },
  error: { type: String, default: '' },
  closeLabel: { type: String, default: 'Close' },
  emptyText: { type: String, default: 'No options available' },
}
export const selectEmits = radioGroupEmits
export const inputProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  modelValue: { type: String, default: '' },
  label: { type: String, required: true as const },
  placeholder: { type: String, default: '' },
  helperText: { type: String, default: '' },
  error: { type: String, default: '' },
  type: choice(['text', 'email', 'password', 'tel', 'url', 'search'] as const, 'text'),
  disabled: Boolean,
  readonly: Boolean,
  multiline: Boolean,
  rows: { type: Number, default: 3 },
  maxLength: { type: Number, default: undefined },
  autocapitalize: {
    type: String as PropType<'none' | 'sentences' | 'words' | 'characters'>,
    default: undefined,
    validator: (value: string) => ['none', 'sentences', 'words', 'characters'].includes(value),
  },
  autocorrect: { type: Boolean, default: undefined },
  returnKey: choice(['done', 'next', 'go', 'search', 'send'] as const, 'done'),
  icon: { type: String as PropType<IconName>, default: undefined },
  trailingIcon: { type: String as PropType<IconName>, default: undefined },
}
export const inputEmits = {
  'update:modelValue': (value: string) => typeof value === 'string',
  focus: () => true,
  blur: () => true,
  submit: (value: string) => typeof value === 'string',
}
export const iconProps = {
  id: viewProps.id,
  name: { type: String as PropType<IconName>, required: true as const },
  size: {
    type: [String, Number] as PropType<IconSize>,
    default: 'md',
    validator: (value: IconSize) => typeof value === 'number' || value in iconSizes,
  },
  tone: choice<keyof Palette>(tones, 'text'),
  /** Accessible name. Without it the icon is decorative and hidden from assistive technology. */
  label: { type: String, default: undefined },
}
export const screenProps = {
  ...viewProps,
  scroll: Boolean,
  /** Puts the software keyboard away on a tap outside the editor and, with `scroll`, on a drag towards it. */
  dismissKeyboard: { type: Boolean, default: true },
}
export const revealProps = { ...columnProps, show: Boolean }
export const sheetProps = {
  id: viewProps.id,
  accessibilityLabel: viewProps.accessibilityLabel,
  open: Boolean,
  /** Rendered as the sheet heading and used as its accessible name. */
  title: { type: String, default: undefined },
  /** Allows the scrim, Escape, the back gesture, swiping down and the close button. */
  dismissible: { type: Boolean, default: true },
  fullscreen: Boolean,
  closeLabel: { type: String, default: 'Close' },
  padding: { ...spacingProp, default: 'lg' },
  gap: spacingProp,
  align: columnProps.align,
}
export const sheetEmits = {
  'update:open': (value: boolean) => typeof value === 'boolean',
  close: (reason: SheetCloseReason) => sheetCloseReasons.includes(reason),
  opened: () => true,
}
export const actionEmits = { click: () => true }
export const sliderEmits = { 'update:modelValue': (value: number) => Number.isFinite(value) }

export const componentProps = {
  MScreen: screenProps,
  MRow: rowProps,
  MColumn: columnProps,
  MBox: boxProps,
  MCard: cardProps,
  MText: textProps,
  MButton: buttonProps,
  MSlider: sliderProps,
  MInput: inputProps,
  MSwitch: switchProps,
  MCheckbox: checkboxProps,
  MRadioGroup: radioGroupProps,
  MSelect: selectProps,
  MToast: toastProps,
  MIcon: iconProps,
  MReveal: revealProps,
  MSheet: sheetProps,
}
export type BoxProps = ExtractPropTypes<typeof boxProps>
export type ComponentProps = {
  [Name in keyof typeof componentProps]: ExtractPublicPropTypes<(typeof componentProps)[Name]>
}
