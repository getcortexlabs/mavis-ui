import type { Palette } from './theme/types.js'

export type ChipTone = 'primary' | 'accent'

export function checkChipLabels(label: string, removable: boolean, removeLabel?: string) {
  if (typeof label !== 'string' || !label.trim())
    throw new TypeError('Chip needs a non-empty label.')
  if (removable && (typeof removeLabel !== 'string' || !removeLabel.trim()))
    throw new TypeError('A removable Chip needs a contextual removeLabel.')
}

export function chipColors(colors: Readonly<Palette>, tone: ChipTone, selected: boolean) {
  return {
    color: selected ? colors[tone] : colors.text,
    backgroundColor: selected
      ? colors[tone === 'primary' ? 'primarySoft' : 'accentSoft']
      : colors.surface,
    borderColor: selected ? colors[tone] : colors.border,
  }
}
