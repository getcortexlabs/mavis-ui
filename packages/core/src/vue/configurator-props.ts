import type { PropType } from '@vue/runtime-core'
import type { ChoiceOption, ChoiceValue } from '../choice.js'
import type { NumberLocale } from '../number-input.js'
import { inputProps, boxProps } from './props.js'

const field = {
  id: inputProps.id,
  label: inputProps.label,
  width: inputProps.width,
  grow: inputProps.grow,
  shrink: inputProps.shrink,
  disabled: Boolean,
  readonly: Boolean,
  helperText: inputProps.helperText,
  error: inputProps.error,
  accessibilityHidden: inputProps.accessibilityHidden,
}
export const numberInputProps = {
  ...field,
  modelValue: { type: Number as PropType<number | null>, default: null },
  draft: { type: String, default: undefined },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  locale: {
    type: String as PropType<NumberLocale>,
    default: 'en-US',
    validator: (value: string) => ['en-US', 'pt-BR'].includes(value),
  },
  name: inputProps.name,
  placeholder: inputProps.placeholder,
  incrementLabel: { type: String, default: 'Increase' },
  decrementLabel: { type: String, default: 'Decrease' },
}
export const multiSelectProps = {
  ...field,
  modelValue: { type: Array as PropType<readonly ChoiceValue[]>, default: () => [] },
  options: { type: Array as PropType<readonly ChoiceOption[]>, required: true as const },
  maxSelected: { type: Number, default: undefined },
  placeholder: { type: String, default: 'Choose options' },
  searchLabel: { type: String, default: 'Search options' },
  closeLabel: { type: String, default: 'Done' },
  emptyLabel: { type: String, default: 'No matching options' },
  removeLabel: { type: String, default: 'Remove' },
}
export const imageProps = {
  ...boxProps,
  src: { type: String, required: true as const },
  alt: { type: String, required: true as const },
  aspectRatio: { type: Number, default: 4 / 3 },
  fit: {
    type: String as PropType<'cover' | 'contain'>,
    default: 'cover',
    validator: (value: string) => ['cover', 'contain'].includes(value),
  },
  radius: { ...boxProps.radius, default: 'md' },
  loadingLabel: { type: String, default: 'Loading image' },
  errorLabel: { type: String, default: 'Image unavailable' },
}
