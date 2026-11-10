import {
  whenMotionAvailable,
  type MotionPointer,
  type MotionRegion,
  type MotionSurface,
  type MotionSharedLayout,
} from '@getcortexlabs/mavis-core/experimental'

/** Input, scale and shared presentation each own a lifetime; press belongs to the component. */
export function afterglowMotion(region: MotionRegion, card: MotionSurface, edition: MotionSurface) {
  let shared: MotionSharedLayout | undefined
  let removePointer: (() => void) | undefined
  let input: MotionPointer | undefined
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
        input = pointer
        // Presence is 1 while a pointer hovers the region: the card leans in, and rests at 0
        // on touch devices and wherever hover does not exist.
        motion.bind({
          x: pointer.x,
          y: pointer.y,
          rotate: pointer.presence.to([0, 1], [0, -1.2]),
        })
      })
    removePointer = pointerEnabled ? follow() : undefined
    return () => {
      removePointer?.()
      removePointer = undefined
      input = undefined
      scale()
    }
  })
  const layout = region.onAvailable(() => {
    shared = region.sharedLayout({ transition: { duration: 520, type: 'spring', bounce: 0 } })
    // The shared destination stays stable while the child keeps pointer and press motion.
    shared.attach(edition, 'edition')
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
      input = undefined
    },
    /** What the input reports, for diagnostics: no hover API is a state, not an error. */
    pointer: () =>
      input && !input.disposed
        ? {
            available: input.available,
            execution: input.execution,
            active: input.active,
            presence: input.presence.get(),
            x: input.x.get(),
            y: input.y.get(),
          }
        : null,
    dispose() {
      ready()
      layout()
    },
  }
}
