import type { AccordionItem } from '../accordion.js'
import type { SegmentedOption } from '../segmented.js'
import type { TabOption } from '../tabs.js'
import type { InputAction } from '../input.js'
import type { SheetName } from '../sheet.js'
import { dialogCloseReasons, type DialogCloseReason } from '../dialog.js'
import type { ExtractPropTypes, ExtractPublicPropTypes, PropType } from '@vue/runtime-core'
import type { Palette, Spacing, Radius, FontWeight, Elevation } from '../theme/types.js'
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
export const listItemProps = {
  ...viewProps,
  ...flexProps,
  width: dimensionProp,
  title: { type: String, required: true as const },
  description: { type: String, default: '' },
  interactive: Boolean,
  disabled: Boolean,
}
export const separatorProps = {
  id: viewProps.id,
  orientation: choice(['horizontal', 'vertical'] as const, 'horizontal'),
  length: { type: Number, default: undefined },
  spacing: { ...spacingProp, default: 'none' },
  inset: { ...spacingProp, default: 'none' },
}
export const avatarProps = {
  ...viewProps,
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: choice(['sm', 'md', 'lg', 'xl'] as const, 'md'),
  shape: choice(['circle', 'square'] as const, 'circle'),
}
export const badgeProps = {
  ...viewProps,
  text: { type: [String, Number], required: true as const },
  size: choice(['sm', 'md'] as const, 'md'),
  tone: choice(
    ['neutral', 'primary', 'accent', 'success', 'warning', 'danger'] as const,
    'neutral',
  ),
}
export const chipProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  label: { type: String, required: true as const },
  icon: { type: String as PropType<IconName>, default: undefined },
  tone: choice(['primary', 'accent'] as const, 'primary'),
  selectable: Boolean,
  modelValue: Boolean,
  removable: Boolean,
  removeLabel: { type: String, default: undefined },
  disabled: Boolean,
}
export const chipEmits = {
  'update:modelValue': (value: boolean) => typeof value === 'boolean',
  remove: () => true,
}
export const emptyStateProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  title: { type: String, required: true as const },
  description: { type: String, default: '' },
  icon: { type: String as PropType<IconName>, default: 'inbox' },
  tone: choice(['primary', 'accent'] as const, 'primary'),
  compact: Boolean,
  titleAs: choice(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const, 'h2'),
}
export const progressProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  indeterminate: Boolean,
  label: { type: String, required: true as const },
  indeterminateLabel: { type: String, default: 'Loading' },
  size: choice(['sm', 'md', 'lg'] as const, 'md'),
  tone: choice(['primary', 'accent', 'success', 'warning', 'danger'] as const, 'primary'),
}
export const alertProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  title: { type: String, required: true as const },
  description: { type: String, default: '' },
  tone: choice(['info', 'success', 'warning', 'error'] as const, 'info'),
  dismissible: Boolean,
  closeLabel: { type: String, default: 'Dismiss message' },
  announce: Boolean,
}
export const alertEmits = { close: () => true }
export const skeletonProps = {
  id: viewProps.id,
  ...flexProps,
  width: dimensionProp,
  height: { ...dimensionProp, default: 16 },
  radius: { ...radiusProp, default: 'sm' },
  animated: { type: Boolean, default: true },
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
  padding: spacingProp,
  radius: radiusProp,
  elevation: { type: String as PropType<Elevation>, default: undefined },
  gap: spacingProp,
  interactive: Boolean,
  disabled: Boolean,
}
export const buttonProps = {
  ...viewProps,
  ...flexProps,
  text: { type: String, default: undefined },
  // HTML form behavior; NativeScript buttons remain application actions.
  type: choice(['button', 'submit', 'reset'] as const, 'button'),
  name: { type: String, default: undefined },
  value: { type: String, default: undefined },
  form: { type: String, default: undefined },
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
export const weightProp = { type: String as PropType<FontWeight>, default: undefined }
export const spanProps = {
  text: { type: String, default: undefined },
  weight: weightProp,
  tone: { type: String as PropType<keyof Palette>, default: undefined },
  emphasis: { type: String as PropType<'strong' | 'em'>, default: undefined },
}
export const textProps = {
  weight: weightProp,
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
export const tabsProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  modelValue: radioGroupProps.modelValue,
  tabs: { type: Array as PropType<readonly TabOption[]>, required: true as const },
  label: { type: String, required: true as const },
  disabled: Boolean,
}
export const tabsEmits = radioGroupEmits
export const accordionProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  items: { type: Array as PropType<readonly AccordionItem[]>, required: true as const },
  modelValue: { type: Array as PropType<readonly ChoiceValue[]>, default: () => [] },
  multiple: Boolean,
  disabled: Boolean,
  label: { type: String, required: true as const },
  expandedLabel: { type: String, default: 'Expanded' },
  collapsedLabel: { type: String, default: 'Collapsed' },
}
export const accordionEmits = {
  'update:modelValue': (value: ChoiceValue[]) => Array.isArray(value) && value.every(isChoiceValue),
}
export const segmentedProps = {
  id: viewProps.id,
  accessibilityHidden: viewProps.accessibilityHidden,
  ...flexProps,
  width: dimensionProp,
  options: { type: Array as PropType<readonly SegmentedOption[]>, required: true as const },
  modelValue: radioGroupProps.modelValue,
  label: { type: String, required: true as const },
  disabled: Boolean,
}
export const segmentedEmits = radioGroupEmits

export const dialogProps = {
  id: viewProps.id,
  open: Boolean,
  title: { type: String, required: true as const },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Continue' },
  cancelLabel: { type: String, default: 'Cancel' },
  loadingLabel: { type: String, default: 'Working…' },
  tone: choice(['default', 'danger'] as const, 'default'),
  loading: Boolean,
  dismissible: { type: Boolean, default: true },
}
export const dialogEmits = {
  'update:open': (value: boolean) => typeof value === 'boolean',
  confirm: () => true,
  close: (reason: DialogCloseReason) => dialogCloseReasons.includes(reason),
}

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
  // Browser editor attributes. NativeScript has no HTML form owner.
  name: { type: String, default: undefined },
  autocomplete: { type: String, default: undefined },
  required: Boolean,
  inputmode: {
    type: String as PropType<
      'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
    >,
    default: undefined,
  },
  form: { type: String, default: undefined },
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
  trailingAction: { type: Object as PropType<InputAction>, default: undefined },
  icon: { type: String as PropType<IconName>, default: undefined },
  trailingIcon: { type: String as PropType<IconName>, default: undefined },
}
export const inputEmits = {
  action: () => true,
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
  MDialog: dialogProps,
  MTabs: tabsProps,
  MSkeleton: skeletonProps,
  MProgress: progressProps,
  MChip: chipProps,
  MEmptyState: emptyStateProps,
  MAccordion: accordionProps,
  MSegmentedControl: segmentedProps,
  MAlert: alertProps,
  MListItem: listItemProps,
  MSeparator: separatorProps,
  MAvatar: avatarProps,
  MBadge: badgeProps,
  MIcon: iconProps,
  MReveal: revealProps,
  MSheet: sheetProps,
}
export type BoxProps = ExtractPropTypes<typeof boxProps>
export type ComponentProps = {
  [Name in keyof typeof componentProps]: ExtractPublicPropTypes<(typeof componentProps)[Name]> &
    (Name extends 'MSheet' ? SheetName : unknown)
}
