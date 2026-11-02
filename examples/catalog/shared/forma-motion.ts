import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'

/** One scalar drives paint and geometry; Jolt owns interpolation and the frame clock. */
export function createFormaMotion(surface: MotionSurface) {
  const progress = surface.motionValue(0)
  const color = surface.springValue(progress, { stiffness: 180, damping: 24 })
  surface.bind({
    backgroundColor: color.to([0, 1], ['#EFB8CF', '#ADC1FF']),
    borderRadius: color.to([0, 1], [8, 32]),
    scale: color.to([0, 1], [1, 1.1]),
  })
  return progress
}
