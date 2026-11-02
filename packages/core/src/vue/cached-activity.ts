import { onActivated, onDeactivated, ref } from '@vue/runtime-core'

/** @internal Vue caches instances, but application observers still need an explicit pause. */
export function useCachedActivity() {
  const active = ref(true)
  onActivated(() => {
    active.value = true
  })
  onDeactivated(() => {
    active.value = false
  })
  return active
}
