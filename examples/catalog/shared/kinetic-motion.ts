import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'

export const kineticStops = [-40, 0, 40] as const

/** This recipe runs unchanged in the browser and on native views. */
export function createKineticMotion(surface: MotionSurface) {
  const scale = surface.motionValue(1)
  const follower = surface.springValue(scale, { stiffness: 160, damping: 18 })
  surface.bind({
    scale: follower,
    y: follower.to([0.94, 1, 1.08], [12, 0, -16]),
    opacity: follower.to([0.94, 1, 1.08], [0.65, 1, 1]),
  })
  const drag = surface.drag({
    axis: 'x',
    bounds: { left: -40, right: 40 },
    snap: { x: kineticStops },
  })
  surface.animate({ rotate: [-4, 0] }, { type: 'spring', duration: 550, bounce: 0.15 })
  return {
    scale,
    follower,
    drag,
    move(x: number) {
      drag.cancel()
      return surface.animate({ x }, { type: 'spring', duration: 450, bounce: 0.12 })
    },
  }
}
