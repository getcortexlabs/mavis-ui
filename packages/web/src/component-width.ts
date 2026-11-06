import { ref, watch } from 'vue'
import { componentMotion } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useConnectedMotion } from './connected-motion.js'
import { useMotionContext } from './motion-context.js'

/** The rail owns its width; labels and focus targets retain their natural geometry. */
export function useComponentWidth(read: () => number) {
  const initial = read()
  const element = ref<HTMLElement>()
  const { theme } = useMavisTheme()
  useConnectedMotion(element, useMotionContext(), (runtime, target) => {
    target.style.width = `${read()}px`
    let playback: ReturnType<typeof runtime.animateSize> | undefined
    const off = watch(
      read,
      (width) => {
        playback = runtime.animateSize(target, { width }, componentMotion(theme.value, 'layout'))
      },
      { flush: 'post' },
    )
    return () => {
      off()
      playback?.stop({ restore: true })
      target.style.width = `${read()}px`
    }
  })
  return {
    width: initial,
    ref: (component: unknown) => {
      element.value = (component as { $el?: HTMLElement } | null)?.$el
    },
  }
}
