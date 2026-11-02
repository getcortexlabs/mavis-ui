import { getCurrentScope, onScopeDispose } from 'vue'
import type { WebMotionScope, WebMotionResource } from '@rafaelaugusto/jolt/web'
import { regionState, type MotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { webRegion } from './motion-region.js'

/**
 * Web-only composition for application HTML/SVG inside a declared MBox region.
 * Borrows the very same Jolt context as the region's component press surfaces.
 * Setup is absent during SSR and recreated with its region and document lifecycle.
 */
export function useMavisWebMotion(
  region: MotionRegion,
  setup: (scope: WebMotionScope, element: HTMLElement) => void | WebMotionResource,
): () => void {
  if (!getCurrentScope()) throw new Error('useMavisWebMotion requires a Vue setup scope.')
  const stop = region.onAvailable(() => {
    const { runtime, target } = webRegion(regionState(region).adapter)
    const owner = runtime.scope()
    try {
      owner.use((scope) => setup(scope, target))
    } catch (error) {
      owner.dispose()
      throw error
    }
    return () => owner.dispose()
  })
  onScopeDispose(stop)
  return stop
}
