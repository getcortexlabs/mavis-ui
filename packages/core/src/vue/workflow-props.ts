import type { PropType } from '@vue/runtime-core'
import type { FormController } from '../form.js'
import type { StepOption } from '../navigation.js'
import type { ChoiceValue } from '../choice.js'

export const formGroupProps = {
  label: { type: String, required: true as const },
  description: { type: String, default: '' },
  id: { type: String, default: undefined },
}
export const formErrorsProps = {
  form: { type: Object as PropType<FormController>, required: true as const },
  title: { type: String, default: 'Review these fields' },
  announce: Boolean,
}
export const stepsProps = {
  steps: { type: Array as PropType<readonly StepOption[]>, required: true as const },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  label: { type: String, required: true as const },
  disabled: Boolean,
  loading: Boolean,
  currentLabel: { type: String, default: 'Current' },
  completeLabel: { type: String, default: 'Complete' },
  errorLabel: { type: String, default: 'Needs attention' },
}
export const paginationProps = {
  modelValue: { type: Number, default: 1 },
  total: { type: Number, required: true as const },
  pageSize: { type: Number, default: 20 },
  siblingCount: { type: Number, default: 1 },
  label: { type: String, default: 'Result pages' },
  previousLabel: { type: String, default: 'Previous' },
  nextLabel: { type: String, default: 'Next' },
  pageLabel: { type: String, default: 'Page' },
  currentLabel: { type: String, default: 'Current' },
  statusText: { type: String, default: '' },
  emptyLabel: { type: String, default: 'No results' },
  invalidPageLabel: { type: String, default: 'This page is no longer available.' },
  loading: Boolean,
  disabled: Boolean,
}
