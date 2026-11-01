import { validateChoices, type ChoiceOption, type ChoiceValue } from './choice.js'

export type TabOption = Pick<ChoiceOption, 'value' | 'label' | 'disabled'>
export interface TabPanelProps {
  value: ChoiceValue
}

export function validateTabs(tabs: readonly TabOption[], value: ChoiceValue | null, label: string) {
  validateChoices(tabs, value)
  if (typeof label !== 'string' || !label.trim())
    throw new TypeError('Tabs need a non-empty label.')
}

/** Keyboard navigation moves focus; activation remains an explicit action. */
export function tabFocusTarget(
  tabs: readonly TabOption[],
  value: ChoiceValue,
  key: string,
  rtl = false,
): TabOption | undefined {
  const enabled = tabs.filter((tab) => !tab.disabled)
  if (key === 'Home') return enabled[0]
  if (key === 'End') return enabled[enabled.length - 1]
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return
  const step = (key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)
  const index = enabled.findIndex((tab) => tab.value === value)
  return enabled[(index + step + enabled.length) % enabled.length]
}

/** Reveal the nearest edge without changing a surrounding vertical scroll view. */
export function tabScrollOffset(left: number, width: number, offset: number, viewport: number) {
  if (left < offset || width >= viewport) return Math.max(0, left)
  if (left + width > offset + viewport) return Math.max(0, left + width - viewport)
  return offset
}
