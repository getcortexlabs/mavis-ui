import type { EventData, View } from '@nativescript/core'
import { onBeforeUnmount, watch, type Ref } from 'nativescript-vue'
import type { MavisTheme } from '@getcortexlabs/mavis-core'
import { attachPressFeedback } from '../native/press.js'

export function usePressFeedback(enabled: () => boolean, theme: Readonly<Ref<MavisTheme>>) {
  let view: View | undefined
  let remove: ReturnType<typeof attachPressFeedback> | undefined

  const release = () => {
    remove?.()
    remove = undefined
  }
  const refresh = () => {
    if (view && enabled()) {
      if (remove) remove.update(theme.value.motion.pressScale)
      else remove = attachPressFeedback(view, theme.value.motion.pressScale)
    } else release()
  }
  const unloaded = () => {
    release()
    view = undefined
  }
  watch([enabled, () => theme.value.motion.pressScale], refresh, { flush: 'post' })
  onBeforeUnmount(unloaded)

  return {
    onLoaded(event: EventData) {
      release()
      view = event.object as View
      refresh()
    },
    onUnloaded: unloaded,
  }
}
