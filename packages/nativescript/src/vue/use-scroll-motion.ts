import type { EventData, ScrollView } from '@nativescript/core'
import { onBeforeUnmount, watch } from 'nativescript-vue'
import type { MotionScrollSource } from '@getcortexlabs/mavis-core/experimental'
import { attachNativeScrollSource } from '../native/scroll-motion.js'

export function useScrollMotion(source: () => MotionScrollSource | undefined) {
  let view: ScrollView | undefined
  let release: (() => void) | undefined
  const clear = () => {
    release?.()
    release = undefined
  }
  const attach = () => {
    clear()
    const reference = source()
    if (reference && view) release = attachNativeScrollSource(reference, view)
  }
  const unload = () => {
    clear()
    view = undefined
  }
  watch(source, attach, { flush: 'post' })
  onBeforeUnmount(unload)
  return {
    onLoaded(event: EventData) {
      view = event.object as ScrollView
      attach()
    },
    onUnloaded: unload,
  }
}
