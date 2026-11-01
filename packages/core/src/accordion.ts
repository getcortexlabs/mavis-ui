import { isChoiceValue, type ChoiceValue } from './choice.js'
import type { IconName } from './icon.js'

export interface AccordionItem {
  value: ChoiceValue
  title: string
  description?: string
  icon?: IconName
  disabled?: boolean
}
export interface AccordionPanelProps {
  item: AccordionItem
}

export function validateAccordion(
  items: readonly AccordionItem[],
  expanded: readonly ChoiceValue[],
  multiple: boolean,
  label: string,
  expandedLabel: string,
  collapsedLabel: string,
) {
  for (const [name, text] of Object.entries({ label, expandedLabel, collapsedLabel })) {
    if (typeof text !== 'string' || !text.trim())
      throw new TypeError(`Accordion ${name} must be a non-empty string.`)
  }
  const seen = new Set<ChoiceValue>()
  for (const item of items) {
    if (!item || !isChoiceValue(item.value) || typeof item.title !== 'string' || !item.title.trim())
      throw new TypeError('Each accordion item needs a string/finite number value and a title.')
    if (seen.has(item.value)) throw new RangeError(`Duplicate accordion item: ${item.value}`)
    seen.add(item.value)
  }
  if (!Array.isArray(expanded) || expanded.some((value) => !isChoiceValue(value)))
    throw new TypeError('Accordion modelValue must be an array of string/finite number values.')
  if (new Set(expanded).size !== expanded.length)
    throw new RangeError('Accordion expanded values must be unique.')
  if (!multiple && expanded.length > 1)
    throw new RangeError('Accordion allows at most one expanded value unless multiple is true.')
}

/** The caller applies the returned array; the input is never mutated. */
export function toggleAccordion(
  item: AccordionItem,
  expanded: readonly ChoiceValue[],
  multiple: boolean,
  disabled = false,
): ChoiceValue[] | undefined {
  if (disabled || item.disabled) return
  if (expanded.includes(item.value)) return expanded.filter((value) => value !== item.value)
  return multiple ? [...expanded, item.value] : [item.value]
}

export function accordionFocusTarget(
  items: readonly AccordionItem[],
  value: ChoiceValue,
  key: string,
): AccordionItem | undefined {
  const enabled = items.filter((item) => !item.disabled)
  if (key === 'Home') return enabled[0]
  if (key === 'End') return enabled[enabled.length - 1]
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return
  const index = enabled.findIndex((item) => item.value === value)
  const step = key === 'ArrowDown' ? 1 : -1
  return enabled[(index + step + enabled.length) % enabled.length]
}
