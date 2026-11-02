/** Theme input shared by recipes and theme validation. */
export function resolvePressScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0 || scale > 1) {
    throw new RangeError('pressScale must be a finite number greater than 0 and at most 1')
  }
  return scale
}

// Recipes describe motion, not input or lifecycle. Adapters own reduced-motion detection:
// native follows Jolt configuration; Web follows prefers-reduced-motion. See guide/motion.
export function pressMotion(value: number | Readonly<MotionTheme>) {
  if (value === null || (typeof value !== 'number' && typeof value !== 'object'))
    throw new RangeError('Press motion needs a valid scale or motion theme')
  const motion = typeof value === 'number' ? { ...defaultMotion, pressScale: value } : value
  validateMotion(motion)
  return {
    composition: 'multiply',
    pressed: [
      { scale: motion.pressScale },
      { type: 'spring', duration: motion.pressDuration, bounce: 0 },
    ],
    released: [
      { scale: 1 },
      { type: 'spring', duration: motion.releaseDuration, bounce: motion.releaseBounce },
    ],
  } as const
}

/** Platform-neutral recipe. The host supplies the target and owns the Jolt playback. */
export function motionRecipe(theme: MavisTheme, name: 'enter' | 'exit') {
  const motion = theme.motion
  validateMotion(motion)
  return name === 'enter'
    ? {
        keyframes: { opacity: [0, 1], y: [motion.enterOffset, 0] },
        transition: { type: 'tween' as const, duration: motion.enterDuration, ease: motion.ease },
      }
    : {
        keyframes: { opacity: [1, 0] },
        transition: { type: 'tween' as const, duration: motion.exitDuration, ease: motion.ease },
      }
}

export const revealMotion = {
  enter: [{ opacity: [0, 1], y: [8, 0] }, { duration: 180 }],
  leave: [{ opacity: 0 }, { duration: 120 }],
} as const
import type { MotionTheme, MavisTheme } from './theme/types.js'

export const defaultMotion: Readonly<MotionTheme> = Object.freeze({
  pressScale: 0.97,
  pressDuration: 200,
  releaseDuration: 450,
  releaseBounce: 0.35,
  enterDuration: 180,
  exitDuration: 120,
  enterOffset: 8,
  ease: 'easeOut',
})

export function validateMotion(motion: Readonly<MotionTheme>) {
  resolvePressScale(motion.pressScale)
  for (const key of [
    'pressDuration',
    'releaseDuration',
    'enterDuration',
    'exitDuration',
    'enterOffset',
  ] as const)
    if (!Number.isFinite(motion[key]) || motion[key] < 0)
      throw new RangeError(`${key} must be a finite nonnegative number`)
  if (
    !Number.isFinite(motion.releaseBounce) ||
    motion.releaseBounce < 0 ||
    motion.releaseBounce > 1
  )
    throw new RangeError('releaseBounce must be between 0 and 1')
  if (!['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(motion.ease))
    throw new RangeError('Unknown motion easing')
}
