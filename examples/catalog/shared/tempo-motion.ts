import type {
  MotionSurface,
  MotionRegion,
  MotionPlayback,
  MotionControlledPlayback,
  MotionTimeline,
  MotionBinding,
  MotionStates,
} from '@getcortexlabs/mavis-core/experimental'

/** One choreography for Web and NativeScript. No renderer objects or application timers. */
export function createTempoMotion(
  surface: MotionSurface,
  region: MotionRegion,
  checkpoint: () => void,
) {
  let playback: MotionPlayback | undefined
  let controlled: MotionControlledPlayback | MotionTimeline | undefined
  const resources: MotionBinding[] = []
  const states: MotionStates = region.states(
    { card: surface },
    {
      idle: { card: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } },
      working: { card: { y: -14, scale: 1.04, rotate: 3, opacity: 1 } },
      error: { card: { x: -12, y: 0, scale: 0.96, rotate: -3, opacity: 1 } },
      success: { card: { x: 0, y: -6, scale: 1.07, rotate: 0, opacity: 1 } },
    },
    { transition: { type: 'spring', duration: 750, bounce: 0.2 } },
  )
  function clear() {
    playback?.stop()
    playback = controlled = undefined
    for (const resource of resources.splice(0).reverse()) resource.dispose()
    states.stop()
  }
  const remember = (handle: MotionControlledPlayback | MotionTimeline) => {
    playback = controlled = handle
    return handle
  }
  return {
    states,
    values() {
      clear()
      surface.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 })
      const value = surface.motionValue(0)
      const x = value.to([0, 1], [-30, 30], { clamp: false })
      const scale = value.to([0, 1], [0.94, 1.06], { clamp: false })
      resources.push(value, x, scale, surface.bind({ x, scale }))
      const animation = surface.animateValue(value, [0, 1, 0.35], {
        type: 'tween',
        duration: 2400,
        ease: 'easeInOut',
      })
      const progress = surface.playbackProgress(animation)
      const opacity = progress.to([0, 1], [0.55, 1])
      resources.push(progress, opacity, surface.bind({ opacity }))
      remember(animation)
      return {
        animation,
        accent: () => surface.animateValue(value, 0.15, { layer: 'accent', duration: 200 }),
        removeAccent: () => surface.stopValue(value, { layer: 'accent' }),
      }
    },
    sequence() {
      clear()
      surface.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 })
      playback = region.sequence([
        [surface, { y: [24, 0], opacity: [0.5, 1] }, { duration: 600 }],
        [surface, { rotate: [0, 4, 0] }, { duration: 900, at: '-120' }],
        () => surface.animate({ scale: [1, 1.08, 1] }, { duration: 500 }),
      ])
      return playback
    },
    timeline() {
      clear()
      surface.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 })
      return remember(
        region.timeline([
          [surface, { x: [-30, 30, 0] }, { duration: 1800 }],
          [surface, { rotate: [0, 4, 0] }, { duration: 1400, at: '<' }],
          {
            at: 1100,
            run: () => {
              checkpoint()
              return surface.animate({ scale: [1, 1.08, 1] }, { duration: 500 })
            },
          },
        ]),
      )
    },
    state(name: string) {
      playback?.stop()
      for (const resource of resources.splice(0).reverse()) resource.dispose()
      playback = states.to(name)
      controlled = undefined
      return playback
    },
    fling(velocity = 700) {
      clear()
      surface.set({ y: 0, scale: 1, rotate: 0, opacity: 1 })
      return remember(
        surface.decay({ x: velocity }, { friction: 0.994, snap: { x: [-40, 0, 40] } }),
      )
    },
    drag() {
      clear()
      surface.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 })
      resources.push(
        surface.drag({
          axis: 'x',
          bounds: { left: -50, right: 50 },
          onRelease: (event) => {
            playback?.stop()
            remember(
              surface.decay({ x: event.velocityX }, { friction: 0.994, snap: { x: [-40, 0, 40] } }),
            )
          },
        }),
      )
    },
    pause() {
      controlled?.pause()
      states.pause()
    },
    resume() {
      controlled?.resume()
      states.resume()
    },
    seek(progress: number) {
      if (controlled && 'progress' in controlled) controlled.progress = progress
    },
    stop: clear,
    dispose() {
      clear()
      states.dispose()
    },
  }
}
