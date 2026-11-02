import type { MavisTheme } from './theme/types.js'

/** Paint uses the theme's interaction timing; adapters own surfaces and disposal. */
export function choiceMotion(theme: Readonly<MavisTheme>) {
  return { type: 'tween' as const, duration: theme.motion.enterDuration, ease: theme.motion.ease }
}
export interface ChoicePaint {
  backgroundColor?: string
  borderColor?: string
  color?: string
  borderRadius?: number
}
