import { createTrack, instantTrack } from '#jolt-track'
import { resolveTransition } from '#jolt-transition'

/** Finite opacity only. Jolt samples the curve; Core Animation owns every frame. */
export function opacityMotion(view, from, to, reduced, completed = () => {}) {
  const track = reduced
    ? instantTrack('opacity', to)
    : createTrack(
        'opacity',
        [from, to],
        resolveTransition({ duration: 240, ease: 'easeOut' }, 'opacity', 2),
        0,
        { timeScale: 1, reducedMotion: false },
      )
  const layer = view.layer
  const key = 'mavis:jolt:opacity'
  let active = true
  const finish = (finished) => {
    if (!active) return
    active = false
    completed(finished)
  }
  CATransaction.begin()
  CATransaction.setDisableActions(true)
  layer.opacity = track.to
  if (track.duration > 0) {
    const animation = CAKeyframeAnimation.animationWithKeyPath('opacity')
    animation.values = NSArray.arrayWithArray([...track.values])
    animation.keyTimes = NSArray.arrayWithArray([...track.times])
    animation.duration = track.duration / 1000
    CATransaction.setCompletionBlock(() => finish(true))
    layer.addAnimationForKey(animation, key)
  }
  CATransaction.commit()
  if (track.duration === 0) finish(true)
  return {
    get active() {
      return active
    },
    cancel() {
      if (!active) return
      const value = layer.presentationLayer?.opacity ?? layer.opacity
      finish(false)
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      layer.opacity = value
      layer.removeAnimationForKey(key)
      CATransaction.commit()
    },
  }
}
