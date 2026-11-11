import { getCurrentScope, onScopeDispose } from 'vue'
import type { WebMotionScope, WebMotionResource } from '@rafaelaugusto/jolt/web'
import { regionState, type MotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { webRegion } from './motion-region.js'

/** Call from an explicit application action; a request does not prove physical vibration. */
export function requestMavisWebHaptic(
  region: MotionRegion,
  style: import('@rafaelaugusto/jolt/web').HapticStyle,
): import('@rafaelaugusto/jolt/web').WebHapticResult {
  return webRegion(regionState(region).adapter).runtime.haptic(style)
}

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

/**
 * Web-only: the region's own policy for reduced motion. `user` follows the system. Components
 * inside the region read the same effective preference, and it returns to `user` when the
 * region leaves the document or the returned function is called.
 */
export function configureMavisWebMotion(
  region: MotionRegion,
  options: { reducedMotion: 'user' | 'always' | 'never' },
): () => void {
  if (!['user', 'always', 'never'].includes(options?.reducedMotion))
    throw new RangeError('reducedMotion must be user, always or never.')
  const stop = region.onAvailable(() => {
    const { runtime } = webRegion(regionState(region).adapter)
    runtime.configure({ reducedMotion: options.reducedMotion })
    return () => runtime.configure({ reducedMotion: 'user' })
  })
  if (getCurrentScope()) onScopeDispose(stop)
  return stop
}
