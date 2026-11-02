import { onBeforeUnmount, watch, type Ref } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { animate } from '@rafaelaugusto/jolt'
import { choiceMotion, type ChoicePaint, type MavisTheme } from '@getcortexlabs/mavis-core'

export function useChoicePaint(
  paint: () => ChoicePaint,
  theme: Readonly<Ref<Readonly<MavisTheme>>>,
) {
  const initial = paint()
  let target: View | undefined
  let playback: ReturnType<typeof animate> | undefined
  function update(instant = false) {
    if (!target?.isLoaded) return
    const previous = playback
    playback = animate(target, paint(), instant ? { duration: 0 } : choiceMotion(theme.value))
    previous?.stop()
  }
  function unload() {
    playback?.stop()
    playback = undefined
    target = undefined
  }
  watch(
    () => [paint(), theme.value.motion],
    () => update(),
    { deep: true, flush: 'post' },
  )
  onBeforeUnmount(unload)
  return {
    style: initial,
    onLoaded: (event: EventData) => {
      unload()
      target = event.object as View
      update(true)
    },
    onUnloaded: unload,
  }
}
