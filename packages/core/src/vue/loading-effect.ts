import { watch, onScopeDispose } from '@vue/runtime-core'
import { markRaw } from '@vue/reactivity'
import {
  createMotionSurface,
  type MotionLoadingEffect,
  type MotionLoaderOptions,
} from '../experimental.js'

/** Internal decoration; the declared presentation and Jolt own its lifetime. */
export function useLoadingDecoration(
  settings: () => MotionLoaderOptions & {
    kind: 'shimmer' | 'dots' | 'bars' | 'ring'
    animated: boolean
  },
) {
  const surface = markRaw(createMotionSurface())
  const off = surface.use((motion) => {
    let resource: MotionLoadingEffect | undefined
    const stop = watch(
      settings,
      (options) => {
        resource?.dispose()
        resource = undefined
        if (!options.animated) return
        resource =
          options.kind === 'shimmer'
            ? motion.shimmer({ duration: options.duration })
            : motion.loader({
                style: options.kind,
                size: options.size,
                color: options.color,
                duration: options.duration,
              })
      },
      { immediate: true },
    )
    return () => {
      stop()
      resource?.dispose()
    }
  })
  onScopeDispose(off)
  return surface
}
