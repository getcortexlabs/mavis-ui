import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onScopeDispose,
  watch,
  type Component,
} from '@vue/runtime-core'
import { createMotionSurface, type MotionPlayback } from '../experimental.js'
import { resolveNumberFlowFormat, type NumberFlowFormat } from '../number-flow-format.js'
import { numberFlowProps } from './interactive-props.js'

export function createNumberFlow(
  Text: Component,
  platform: 'web' | 'native',
  formatter: (locale: string, options: NumberFlowFormat) => (value: number) => string = (
    locale,
    options,
  ) => new Intl.NumberFormat(locale, options).format,
) {
  return defineComponent({
    name: 'MNumberFlow',
    inheritAttrs: false,
    props: numberFlowProps,
    setup(props, { attrs }) {
      const surface = markRaw(createMotionSurface())
      const format = computed(
        () => props.formatValue ?? formatter(props.locale, resolveNumberFlowFormat(props.format)),
      )
      const text = computed(() => {
        if (!Number.isFinite(props.duration) || props.duration <= 0)
          throw new RangeError('MNumberFlow duration must be positive.')
        if (!Number.isFinite(props.value)) throw new RangeError('MNumberFlow value must be finite.')
        return format.value(props.value)
      })
      let playback: MotionPlayback | undefined
      watch(
        () => [props.value, format.value] as const,
        () => {
          if (!props.animated) playback?.stop()
          if (surface.available && props.animated)
            playback = surface.rollTo(props.value, {
              format: format.value,
              duration: props.duration,
              stagger: 24,
              tabular: true,
            })
        },
        { flush: 'pre' },
      )
      watch(
        () => props.animated,
        () => {
          if (!props.animated) playback?.stop()
        },
      )
      onScopeDispose(() => playback?.stop())
      return () =>
        h(
          Text,
          mergeProps(attrs, {
            id: props.id,
            text: text.value,
            variant: props.variant,
            tone: props.tone,
            motionSurface: surface,
            accessibilityLabel: props.label ? `${props.label}: ${text.value}` : text.value,
            ...(platform === 'web'
              ? {
                  class: 'm-number-flow',
                  role: props.announce ? 'status' : undefined,
                  'aria-live': props.announce ? 'polite' : 'off',
                  'aria-atomic': 'true',
                  style: { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
                }
              : { accessibilityLiveRegion: props.announce ? 'polite' : 'none' }),
          }),
        )
    },
  })
}
