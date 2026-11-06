import {
  animate,
  motionValue,
  set,
  stop,
  onReducedMotion,
  reducedMotion,
  type MotionValue,
} from '@rafaelaugusto/jolt'
import { onBeforeUnmount, onActivated, onDeactivated, ref, watch } from 'nativescript-vue'

export function useAnimatedNumber(read: () => number, direct: () => boolean) {
  const shown = ref(read())
  let value: MotionValue | undefined
  let off: (() => void) | undefined, releaseReduced: (() => void) | undefined
  const settle = () => {
    if (value) {
      stop(value)
      set(value, read())
    }
    shown.value = read()
  }
  const update = () => {
    if (!value || direct() || reducedMotion()) settle()
    else animate(value, read(), { type: 'spring', duration: 340, bounce: 0.08 })
  }
  function load() {
    if (value) return
    value = motionValue(read())
    off = value.subscribe(
      (next) => {
        shown.value = next
      },
      { immediate: true },
    )
    releaseReduced = onReducedMotion(() => {
      if (reducedMotion()) settle()
    })
  }
  function unload() {
    off?.()
    off = undefined
    releaseReduced?.()
    releaseReduced = undefined
    if (value) stop(value)
    value = undefined
    shown.value = read()
  }
  watch([read, direct], update, { flush: 'sync' })
  onBeforeUnmount(unload)
  onDeactivated(unload)
  // Loaded is authoritative on first mount and on cached/native page reattachment.
  onActivated(() => {
    if (value) settle()
  })
  return { shown, onLoaded: load, onUnloaded: unload }
}
