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
    let release: (() => void) | undefined
    const stop = watch(
      surface,
      (reference) => {
        release?.()
        release = undefined
        if (reference)
          release = bindMotionSurface(
            reference,
            webMotionSurface(runtime, target, () => true, runtime, undefined, undefined, plainText)
              .adapter,
          )
      },
      { immediate: true, flush: 'post' },
    )
    return () => {
      stop()
      release?.()
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
