/** Labels can change with the language; values identify the choices. */
export type ChoiceValue = string | number
export interface ChoiceOption {
  value: ChoiceValue
  label: string
  helperText?: string
  disabled?: boolean
}

export function isChoiceValue(value: unknown): value is ChoiceValue {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
}

/** A typed key keeps the number 1 distinct from the string "1". */
export function choiceKey(value: ChoiceValue): string {
  return `${typeof value === 'number' ? 'n' : 's'}:${value}`
}

export function validateChoices(options: readonly ChoiceOption[], value: ChoiceValue | null) {
  if (value !== null && !isChoiceValue(value))
    throw new TypeError('Choice values must be strings, finite numbers or null for no selection.')
  const seen = new Set<ChoiceValue>()
  for (const option of options) {
    if (
      !option ||
      !isChoiceValue(option.value) ||
      typeof option.label !== 'string' ||
      !option.label.trim()
    )
      throw new TypeError(
        'Each choice needs a string or finite number value and a non-empty label.',
      )
    if (seen.has(option.value)) throw new RangeError(`Duplicate choice value: ${option.value}`)
    seen.add(option.value)
  }
}

/** Disabled and repeated activations leave the controlled value alone. */
export function canChoose(option: ChoiceOption, value: ChoiceValue | null, disabled = false) {
  return !disabled && !option.disabled && option.value !== value
}
