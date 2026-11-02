import { onBeforeUnmount, watch } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import type { MotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { attachNativeMotionRegion } from '../native/motion-region.js'

export function useMotionRegion(reference: () => MotionRegion | undefined) {
  let target: View | undefined, release: (() => void) | undefined
  const clear = () => {
    release?.()
    release = undefined
  }
  const attach = () => {
    clear()
    const region = reference()
    if (region && target?.isLoaded) release = attachNativeMotionRegion(region, target)
  }
  watch(reference, attach, { flush: 'post' })
  onBeforeUnmount(clear)
  return {
    onLoaded(event: EventData) {
      target = event.object as View
      attach()
    },
    onUnloaded() {
      clear()
      target = undefined
    },
  }
}
