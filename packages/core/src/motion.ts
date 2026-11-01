/** Theme input shared by recipes and theme validation. */
export function resolvePressScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0 || scale > 1) {
    throw new RangeError('pressScale must be a finite number greater than 0 and at most 1')
  }
  return scale
}

// Recipes describe motion, not input or lifecycle. Adapters own reduced-motion detection:
// native follows Jolt configuration; CSS follows prefers-reduced-motion. See guide/motion.
export function pressMotion(scale: number) {
  return {
    composition: 'multiply',
    pressed: [{ scale: resolvePressScale(scale) }, { type: 'spring', duration: 200, bounce: 0 }],
    released: [{ scale: 1 }, { type: 'spring', duration: 450, bounce: 0.35 }],
    // Keep the existing CSS approximation until the Web adapter can execute the spring.
    fallback: { duration: 120, ease: 'ease-out' },
  } as const
}

export const revealMotion = {
  enter: [{ opacity: [0, 1], y: [8, 0] }, { duration: 180 }],
  leave: [{ opacity: 0 }, { duration: 120 }],
  fallback: { enterEase: 'ease-out', leaveEase: 'ease-in' },
} as const
