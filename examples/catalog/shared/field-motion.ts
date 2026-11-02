import type {
  MotionScrollSource,
  MotionSurface,
  MotionScrollOptions,
} from '@getcortexlabs/mavis-core/experimental'

/** The adapters resolve the scrolling Screen and the component's platform surface. */
export function createFieldMotion(
  source: MotionScrollSource,
  surface: MotionSurface,
  execution: MotionScrollOptions['execution'] = 'auto',
) {
  return surface.scrollLinked(
    source,
    {
      y: [0, 80],
      scale: [1, 0.9],
      opacity: [1, 0.35],
    },
    { range: [0, 240], execution },
  )
}
