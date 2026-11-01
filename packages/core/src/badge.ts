import type { Palette } from './theme/types.js'
export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'

export function badgeColors(colors: Readonly<Palette>, tone: BadgeTone) {
  if (tone === 'primary') return { color: colors.primary, backgroundColor: colors.primarySoft }
  if (tone === 'accent') return { color: colors.accent, backgroundColor: colors.accentSoft }
  return {
    color: tone === 'neutral' ? colors.text : colors[tone],
    backgroundColor: colors.elevated,
  }
}
