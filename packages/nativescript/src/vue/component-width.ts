import { watch, onScopeDispose } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { animateSize } from '@rafaelaugusto/jolt'
import { componentMotion } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

export function useComponentWidth(read: () => number) {
  const initial = read()
  const { theme } = useMavisTheme()
  let view: View | undefined
  let playback: ReturnType<typeof animateSize> | undefined
  const release = () => {
    playback?.stop({ restore: true })
    playback = undefined
    view = undefined
  }
  watch(
    read,
    (width) => {
      if (view?.isLoaded)
        playback = animateSize(view, { width }, componentMotion(theme.value, 'layout'))
    },
    { flush: 'post' },
  )
  onScopeDispose(release)
  return {
    width: initial,
    onLoaded: (event: EventData) => {
      view = event.object as View
      view.width = read()
    },
    onUnloaded: release,
  }
}
