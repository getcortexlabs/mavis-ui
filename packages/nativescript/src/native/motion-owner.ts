import { motionScope } from '@rafaelaugusto/jolt'
import type { MotionSurfaceAdapter } from '@getcortexlabs/mavis-core/experimental'
import type { View } from '@nativescript/core'
import { registerNativeSurface } from './motion-region.js'

/** Native scopes also recreate subscriptions after application suspension. */
export function nativeMotionOwner(
  adapter: MotionSurfaceAdapter,
  target: View,
): MotionSurfaceAdapter {
  const result: MotionSurfaceAdapter = {
    ...adapter,
    use(setup) {
      const parent = motionScope()
      try {
        parent.use(() => {
          const child = motionScope()
          const owned: MotionSurfaceAdapter = {
            ...result,
            animate: (...args) => child.add(result.animate(...args)),
            set: (...args) => child.add(result.set(...args)),
            motionValue:
              result.motionValue && ((...args) => child.add(result.motionValue!(...args))),
            springValue:
              result.springValue && ((...args) => child.add(result.springValue!(...args))),
            map: result.map && ((...args) => child.add(result.map!(...args))),
            bind: result.bind && ((...args) => child.add(result.bind!(...args))),
            drag: result.drag && ((...args) => child.add(result.drag!(...args))),
            pointerFollow:
              result.pointerFollow && ((...args) => child.add(result.pointerFollow!(...args))),
            scrollLinked:
              result.scrollLinked && ((...args) => child.add(result.scrollLinked!(...args))),
          }
          registerNativeSurface(owned, target)
          let cleanup: () => void
          try {
            cleanup = setup(owned)
          } catch (error) {
            child.dispose()
            throw error
          }
          return () => {
            try {
              cleanup()
            } finally {
              child.dispose()
            }
          }
        })
      } catch (error) {
        parent.dispose()
        throw error
      }
      return () => parent.dispose()
    },
  }
  registerNativeSurface(result, target)
  return result
}
