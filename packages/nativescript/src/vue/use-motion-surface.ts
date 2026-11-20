import { inject, onBeforeUnmount, watch } from 'nativescript-vue'
import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { createNativeMotionSurface } from '../native/motion-binding.js'
import { perspectiveKey } from './perspective.js'

export function useMotionSurface(
  surface: () => MotionSurface | undefined,
  enabled: () => boolean = () => true,
  plainText: () => boolean = () => false,
  afterLayout = false,
) {
  const perspective = inject(perspectiveKey, undefined)
  const binding = createNativeMotionSurface(surface, enabled, plainText, afterLayout, perspective)
  watch(surface, binding.refresh, { flush: 'post' })
  if (perspective) watch(perspective, binding.refreshPerspective, { flush: 'post' })
  watch(enabled, binding.refreshEnabled, { flush: 'sync' })
  onBeforeUnmount(binding.onUnloaded)
  return {
    allowsActivation: binding.allowsActivation,
    onLoaded: binding.onLoaded,
    onUnloaded: binding.onUnloaded,
  }
}
