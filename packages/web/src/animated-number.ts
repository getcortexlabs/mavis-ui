import { onMounted, onBeforeUnmount, onActivated, onDeactivated, ref, watch } from 'vue'
import { useMotionContext } from './motion-context.js'

/** Jolt owns timing; this adapter writes a numeric layout/clip value at the renderer boundary. */
export function useAnimatedNumber(read: () => number, direct: () => boolean) {
  const shown = ref(read())
  const context = useMotionContext()
  let lease: ReturnType<typeof context.acquire> | undefined
  let value: ReturnType<ReturnType<typeof context.acquire>['runtime']['motionValue']> | undefined
  let off: (() => void) | undefined
  let preference: MediaQueryList | undefined
  const settle = () => {
    if (!value || !lease) {
      shown.value = read()
      return
    }
    lease.runtime.stop(value)
    lease.runtime.set(value, read())
    shown.value = read()
  }
  const reduced = () => {
    if (preference?.matches) settle()
  }
  const update = () => {
    if (!lease || !value || direct() || preference?.matches) {
      settle()
      return
    }
    lease.runtime.animate(value, read(), { type: 'spring', duration: 340, bounce: 0.08 })
  }
  const attach = () => {
    if (lease) return
    lease = context.acquire(document)
    value = lease.runtime.motionValue(read())
    off = value.subscribe((next) => {
      shown.value = next
    })
    preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    preference.addEventListener('change', reduced)
    shown.value = read()
  }
  const detach = () => {
    preference?.removeEventListener('change', reduced)
    preference = undefined
    off?.()
    off = undefined
    value?.dispose()
    value = undefined
    lease?.release()
    lease = undefined
    shown.value = read()
  }
  watch([read, direct], update, { flush: 'sync' })
  onMounted(attach)
  onActivated(attach)
  onDeactivated(detach)
  onBeforeUnmount(detach)
  return shown
}
