import { defineComponent, h, ref, watch, type PropType } from 'vue'
import { choiceMotion, type ChoicePaint } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useConnectedMotion } from '../connected-motion.js'
import { useMotionContext } from '../motion-context.js'

/** One paint owner per decorative surface; native control semantics remain in the parent. */
export const ChoicePaintSurface = defineComponent({
  name: 'MavisChoicePaint',
  inheritAttrs: false,
  props: { paint: { type: Object as PropType<ChoicePaint>, required: true } },
  setup(props, { slots, attrs }) {
    const element = ref<HTMLElement>()
    const { theme } = useMavisTheme()
    const forcedColors = ref(false)
    const initial = {
      position: 'absolute' as const,
      inset: 'calc(-1 * var(--m-choice-border, 0px))',
      border: 'inherit',
      borderRadius: 'inherit',
      boxSizing: 'border-box' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...props.paint,
    }
    useConnectedMotion(element, useMotionContext(), (runtime, target) => {
      const forced = target.ownerDocument.defaultView!.matchMedia('(forced-colors: active)')
      let playback: ReturnType<typeof runtime.animate> | undefined
      let geometry: ReturnType<typeof runtime.observeGeometry> | undefined
      function update(instant = false) {
        forcedColors.value = forced.matches
        if (forced.matches) {
          playback?.stop()
          playback = undefined
          runtime.release(target)
          geometry?.dispose()
          geometry = undefined
          for (const key of ['background-color', 'border-color', 'color'])
            target.style.removeProperty(key)
          return
        }
        if (!geometry) {
          runtime.set(target, props.paint)
          geometry = runtime.observeGeometry(target)
        }
        const previous = playback
        playback = runtime.animate(
          target,
          props.paint,
          instant ? { duration: 0 } : choiceMotion(theme.value),
        )
        previous?.stop()
      }
      const changed = () => update(true)
      forced.addEventListener('change', changed)
      update(true)
      const unwatch = watch(
        () => [props.paint, theme.value.motion],
        () => update(),
        { deep: true, flush: 'post' },
      )
      return () => {
        unwatch()
        forced.removeEventListener('change', changed)
        playback?.stop()
        runtime.release(target)
        geometry?.dispose()
      }
    })
    return () =>
      h('span', { ...attrs, 'aria-hidden': 'true' }, [
        h(
          'span',
          {
            ref: element,
            style: {
              ...initial,
              // Vue patches style objects on slot updates. Preserve the paint written by Jolt.
              ...Object.fromEntries(
                Object.keys(props.paint).map((key) => [
                  key,
                  forcedColors.value
                    ? undefined
                    : element.value?.style?.[key as 'backgroundColor'] ||
                      initial[key as keyof typeof initial],
                ]),
              ),
            },
            'data-m-choice-paint': '',
          },
          slots.default?.(),
        ),
      ])
  },
})
