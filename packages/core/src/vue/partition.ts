import { computed, onScopeDispose, ref, watch } from '@vue/runtime-core'
import { finiteRange, positiveSize } from '../interactive.js'

/** Shared transaction: dragging follows input; cancellation restores the owner's starting value. */
export function usePartition(
  read: () => number,
  options: () => { min: number; max: number; step: number; disabled: boolean },
  emit: (value: number) => void,
) {
  const dragging = ref(false)
  const canonical = computed(() => finiteRange(read(), options().min, options().max))
  let origin = 0
  function update(value: number) {
    const config = options()
    if (config.disabled) return
    const step = positiveSize(config.step, 'step')
    const next = finiteRange(
      config.min + Math.round((value - config.min) / step) * step,
      config.min,
      config.max,
    )
    if (next !== canonical.value) emit(Number(next.toFixed(8)))
  }
  function begin() {
    if (options().disabled) return false
    origin = canonical.value
    dragging.value = true
    return true
  }
  function end() {
    dragging.value = false
  }
  function cancel() {
    if (dragging.value) {
      dragging.value = false
      emit(origin)
    }
  }
  watch(
    () => options().disabled,
    (disabled) => {
      if (disabled) cancel()
    },
  )
  onScopeDispose(() => {
    dragging.value = false
  })
  return { canonical, dragging, update, begin, end, cancel }
}
