import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'

export const studioMotion = {
  keyframes: { scale: 1.2, y: [0, -10, 0], rotate: [0, -3, 0] },
  transition: { duration: 1600, ease: 'easeInOut' },
} as const

// This application function and definition run unchanged in both renderers.
export function animateStudioSurface(surface: MotionSurface) {
  return surface.animate(studioMotion.keyframes, studioMotion.transition)
}
