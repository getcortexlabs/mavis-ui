import { pressMotion, revealMotion } from '@getcortexlabs/mavis-core'

/** CSS consumes the scalar recipe values; it does not approximate Jolt's spring solver. */
export function pressStyle(scale: number) {
  const motion = pressMotion(scale)
  return {
    '--m-press-scale': motion.pressed[0].scale,
    '--m-press-duration': `${motion.fallback.duration}ms`,
    '--m-press-ease': motion.fallback.ease,
  }
}

export const revealStyle = {
  '--m-reveal-enter-duration': `${revealMotion.enter[1].duration}ms`,
  '--m-reveal-leave-duration': `${revealMotion.leave[1].duration}ms`,
  '--m-reveal-enter-opacity': revealMotion.enter[0].opacity[0],
  '--m-reveal-enter-y': `${revealMotion.enter[0].y[0]}px`,
  '--m-reveal-leave-opacity': revealMotion.leave[0].opacity,
  '--m-reveal-enter-ease': revealMotion.fallback.enterEase,
  '--m-reveal-leave-ease': revealMotion.fallback.leaveEase,
}
