import { onScopeDispose, type Ref } from 'vue'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'
import type { WebRuntime } from '@rafaelaugusto/jolt/web'
import type { WebMotionContext } from './motion-context.js'

/** Jolt owns deferred insertion and KeepAlive; the presentation borrows its region's runtime. */
export function useConnectedMotion(
  element: Readonly<Ref<HTMLElement | null | undefined>>,
  context: WebMotionContext,
  setup: (runtime: WebRuntime, target: HTMLElement) => () => void,
) {
  let lease: ReturnType<WebMotionContext['acquire']> | undefined
  const motion = useWebMotion(element, {
    get runtime() {
      // Evaluated only by Jolt after attachment, never during SSR or pending Suspense.
      if (!lease && element.value) lease = context.acquire(element.value.ownerDocument)
      return lease?.runtime
    },
  })
  motion.use((_, target) => setup(lease!.runtime, target))
  // Registered after Jolt: dispose its scopes before releasing the borrowed runtime.
  onScopeDispose(() => lease?.release())
}
