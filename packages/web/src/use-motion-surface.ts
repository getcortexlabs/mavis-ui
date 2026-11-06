import { shallowRef, computed, watch, type VNode } from 'vue'
import { bindMotionSurface, type MotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useConnectedMotion } from './connected-motion.js'
import { useMotionContext } from './motion-context.js'
import { webMotionSurface } from './motion-surface.js'

/** A declared non-press surface; Jolt owns connection and KeepAlive observation. */
export function useMotionSurface(
  surface: () => MotionSurface | undefined,
  plainText: () => boolean = () => false,
) {
  const element = shallowRef<HTMLElement>()
  const connected = computed(() => (surface() ? element.value : undefined))
  useConnectedMotion(connected, useMotionContext(), (runtime, target) => {
    // Responsive layout can resize a declared surface before an animation ends.
    // Keep Jolt's geometry lease alive until every playback has been released.
    let geometry: ReturnType<typeof runtime.observeGeometry> | undefined
    const display = target.ownerDocument.defaultView!.getComputedStyle(target).display
    if (!['inline', 'none', 'contents'].includes(display)) {
      runtime.set(target, { scale: 1 })
      geometry = runtime.observeGeometry(target)
    }
    let release: (() => void) | undefined
    let stop: () => void
    try {
      stop = watch(
        surface,
        (reference) => {
          release?.()
          release = undefined
          if (reference)
            release = bindMotionSurface(
              reference,
              webMotionSurface(
                runtime,
                target,
                () => true,
                runtime,
                undefined,
                undefined,
                plainText,
              ).adapter,
            )
        },
        { immediate: true, flush: 'post' },
      )
    } catch (error) {
      geometry?.dispose()
      throw error
    }
    return () => {
      stop()
      try {
        release?.()
      } finally {
        geometry?.dispose()
      }
    }
  })
  return {
    onVnodeMounted: (vnode: VNode) => {
      element.value = vnode.el as HTMLElement
    },
    onVnodeBeforeUnmount: () => {
      element.value = undefined
    },
  }
}
