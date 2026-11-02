import {
  whenMotionAvailable,
  type MotionRegion,
  type MotionSurface,
  type MotionSharedLayout,
} from '@getcortexlabs/mavis-core/experimental'

/** Input, scale and shared presentation each own a lifetime; press belongs to the component. */
export function afterglowMotion(region: MotionRegion, card: MotionSurface) {
  let shared: MotionSharedLayout | undefined
  let removePointer: (() => void) | undefined
  let pointerEnabled = true
  const ready = whenMotionAvailable([region, card], () => {
    const scale = card.use((motion) => {
      const value = motion.motionValue(1.025)
      motion.bind({ scale: value })
    })
    const follow = () =>
      card.use((motion) => {
        const pointer = motion.pointerFollow(region, {
          range: { x: [-12, 12], y: [-8, 8] },
          spring: { stiffness: 140, damping: 22 },
        })
        motion.bind({ x: pointer.x, y: pointer.y })
      })
    removePointer = pointerEnabled ? follow() : undefined
    return () => {
      removePointer?.()
      removePointer = undefined
      scale()
    }
  })
  const layout = region.onAvailable(() => {
    shared = region.sharedLayout({ transition: { duration: 520, type: 'spring', bounce: 0 } })
    shared.attach(card, 'edition')
    return () => {
      shared = undefined
    }
  })
  return {
    transition(change: () => void) {
      const playback = shared?.transition(change)
      if (!shared) change()
      // An application action can pulse without taking over pointer or press channels.
      if (card.available) card.animate({ opacity: [1, 0.82, 1] }, { duration: 420 })
      return playback
    },
    cancel: () => shared?.cancel(),
    stopPointer() {
      pointerEnabled = false
      removePointer?.()
      removePointer = undefined
    },
    dispose() {
      ready()
      layout()
    },
  }
}
