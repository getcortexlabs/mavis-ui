import { onBeforeUnmount, ref } from 'vue'

export function useCopy() {
  const copied = ref(false)
  const failed = ref(false)
  let timer
  let alive = true
  onBeforeUnmount(() => {
    alive = false
    clearTimeout(timer)
  })
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value)
      if (!alive) return
      failed.value = false
      copied.value = true
      clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), 2400)
    } catch {
      if (alive) failed.value = true
    }
  }
  return { copy, copied, failed }
}
