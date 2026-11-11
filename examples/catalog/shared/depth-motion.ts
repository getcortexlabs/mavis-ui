import type { MavisTheme } from '@getcortexlabs/mavis-core'
import {
  elevationMotion,
  motionPath,
  type MotionSurface,
} from '@getcortexlabs/mavis-core/experimental'

// One definition per capability. The same functions run in both renderers.
export const courierPath = motionPath(
  { x: 0, y: 0 },
  { to: { x: 88, y: -12 }, control: { x: 36, y: -76 } },
  {
    to: { x: 196, y: 0 },
    control: [
      { x: 128, y: 36 },
      { x: 172, y: -64 },
    ],
  },
)
export const depthMotion = {
  travel: { duration: 1400, ease: 'easeInOut' },
  tilt: { rotateX: 14, rotateY: -22 },
  settle: { type: 'spring', duration: 700, bounce: 0.2 },
  lift: { type: 'spring', duration: 500, bounce: 0 },
  rise: -8,
} as const

export function sendCourier(surface: MotionSurface) {
  return surface.animate({ path: courierPath, orient: true }, depthMotion.travel)
}
export function recallCourier(surface: MotionSurface) {
  return surface.set({ x: 0, y: 0, rotate: 0 })
}
export function tiltPanel(surface: MotionSurface, tilted: boolean) {
  return surface.animate(tilted ? depthMotion.tilt : { rotateX: 0, rotateY: 0 }, depthMotion.settle)
}
/** Replaces one axis; the other keeps the angle it already has. */
export function turnPanel(surface: MotionSurface) {
  return surface.animate({ rotateY: -depthMotion.tilt.rotateY }, depthMotion.settle)
}
/** Where the shadow cannot move, the card still rises and keeps the theme's static shadow. */
export function liftCard(surface: MotionSurface, theme: MavisTheme, raised: boolean) {
  const shadow = surface.supports('shadow')
    ? elevationMotion(theme.elevation[raised ? 'lg' : 'sm'])
    : {}
  return surface.animate({ y: raised ? depthMotion.rise : 0, ...shadow }, depthMotion.lift)
}
