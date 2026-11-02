import { choiceKey, validateChoices, type ChoiceOption, type ChoiceValue } from './choice.js'

export function validateMultiSelection(
  options: readonly ChoiceOption[],
  values: readonly ChoiceValue[],
  max?: number,
) {
  validateChoices(options, null)
  if (max !== undefined && (!Number.isInteger(max) || max < 1))
    throw new RangeError('maxSelected must be a positive integer.')
  const keys = values.map(choiceKey)
  if (new Set(keys).size !== keys.length) throw new RangeError('Selected values must be unique.')
  if (values.some((value) => !options.some((option) => option.value === value)))
    throw new RangeError('Each selected value needs a matching option.')
  if (max !== undefined && values.length > max)
    throw new RangeError('Selection exceeds maxSelected.')
}

export function toggleMultiSelection(
  options: readonly ChoiceOption[],
  values: readonly ChoiceValue[],
  value: ChoiceValue,
  max?: number,
) {
  validateMultiSelection(options, values, max)
  const option = options.find((item) => item.value === value)
  if (!option || option.disabled) return null
  if (values.includes(value)) return values.filter((item) => item !== value)
  return max !== undefined && values.length >= max ? null : [...values, value]
}
