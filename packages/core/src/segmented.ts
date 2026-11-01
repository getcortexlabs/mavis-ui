import { validateChoices, type ChoiceOption, type ChoiceValue } from './choice.js'

export type SegmentedOption = Pick<ChoiceOption, 'value' | 'label' | 'disabled'>
export const segmentedMotion = Object.freeze({
  duration: 180,
  ease: 'easeOut',
  cssEase: 'ease-out',
} as const)

export function validateSegments(
  options: readonly SegmentedOption[],
  value: ChoiceValue | null,
  label: string,
) {
  validateChoices(options, value)
  if (typeof label !== 'string' || !label.trim())
    throw new TypeError('SegmentedControl needs a non-empty label.')
}

/** A segmented choice follows radio behavior: arrows both focus and request selection. */
export function segmentedFocusTarget(
  options: readonly SegmentedOption[],
  value: ChoiceValue,
  key: string,
  rtl = false,
): SegmentedOption | undefined {
  const enabled = options.filter((option) => !option.disabled)
  if (key === 'Home') return enabled[0]
  if (key === 'End') return enabled[enabled.length - 1]
  const direction = {
    ArrowRight: rtl ? -1 : 1,
    ArrowLeft: rtl ? 1 : -1,
    ArrowDown: 1,
    ArrowUp: -1,
  }[key]
  if (!direction) return
  const index = enabled.findIndex((option) => option.value === value)
  return enabled[(index + direction + enabled.length) % enabled.length]
}
