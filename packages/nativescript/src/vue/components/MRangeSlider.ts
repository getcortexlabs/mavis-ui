import { computed, defineComponent, h, markRaw, mergeProps, ref } from 'nativescript-vue'
import type { EventData, PanGestureEventData, View } from '@nativescript/core'
import { moveRange, rangeValue, type RangeValue } from '@getcortexlabs/mavis-core'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { rangeSliderProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MColumn, MRow, MBox } from './layout.js'
import { MText } from './MText.js'
import { MNumberInput } from './configurator.js'

/** Large touch handles plus labelled native editors for precise and assistive input. */
export const MRangeSlider = defineComponent({
  name: 'MRangeSlider',
  inheritAttrs: false,
  props: rangeSliderProps,
  emits: { 'update:modelValue': (_value: RangeValue) => true },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const width = ref(0)
    const surfaces = [markRaw(createMotionSurface()), markRaw(createMotionSurface())]
    const pair = computed(() => rangeValue(props.modelValue, props.min, props.max, props.step))
    const origins = [0, 0]
    const format = (value: number) => props.formatValue?.(value) ?? String(value)
    function update(thumb: 0 | 1, value: number | null) {
      if (value === null || props.disabled || props.readonly) return
      const next = moveRange(pair.value, thumb, value, props.min, props.max, props.step)
      if (next[thumb] !== pair.value[thumb]) emit('update:modelValue', next)
    }
    return () => {
      const travel = Math.max(0, width.value - 48)
      const position = (value: number) => ((value - props.min) / (props.max - props.min)) * travel
      return h(MColumn, mergeProps({ id: props.id, gap: 'sm' }, attrs), () => [
        h(MRow, { justify: 'between', gap: 'md', wrap: true }, () => [
          h(MText, { text: props.label, weight: '600' }),
          h(MText, { text: `${format(pair.value[0])} – ${format(pair.value[1])}`, tone: 'muted' }),
        ]),
        h(
          'AbsoluteLayout',
          {
            height: 56,
            onLayoutChanged: (event: EventData) => {
              width.value = (event.object as View).getActualSize().width
            },
          },
          [
            h('StackLayout', {
              left: 24,
              top: 25,
              width: travel,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.value.colors.border,
              accessibilityHidden: true,
            }),
            h('StackLayout', {
              left: 24 + position(pair.value[0]),
              top: 25,
              width: position(pair.value[1]) - position(pair.value[0]),
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.value.colors.primary,
              accessibilityHidden: true,
            }),
            ...([0, 1] as const).map((thumb) =>
              h(
                MBox,
                {
                  key: thumb,
                  left: position(pair.value[thumb]),
                  top: 4,
                  width: 48,
                  height: 48,
                  accessibilityHidden: true,
                  onPan: (event: PanGestureEventData) => {
                    if (props.disabled || props.readonly || !travel) return
                    const motion = surfaces[thumb]!
                    if (event.state === 1) {
                      origins[thumb] = pair.value[thumb]
                      if (motion.available) motion.animate({ scale: 1.15 }, { duration: 120 })
                    }
                    if (event.state === 2)
                      update(
                        thumb,
                        origins[thumb]! + (event.deltaX / travel) * (props.max - props.min),
                      )
                    if (event.state === 3 || event.state === 4) {
                      if (motion.available)
                        motion.animate(
                          { scale: 1 },
                          { type: 'spring', duration: 180, bounce: 0.15 },
                        )
                    }
                  },
                },
                () =>
                  h(MBox, {
                    motionSurface: surfaces[thumb],
                    width: 26,
                    height: 26,
                    radius: 'full',
                    backgroundColor: theme.value.colors.primary,
                    horizontalAlignment: 'center',
                    verticalAlignment: 'middle',
                  }),
              ),
            ),
          ],
        ),
        h(MColumn, { gap: 'md' }, () =>
          ([0, 1] as const).map((thumb) =>
            h(MNumberInput, {
              label: thumb === 0 ? props.lowerLabel : props.upperLabel,
              modelValue: pair.value[thumb],
              min: thumb === 0 ? props.min : pair.value[0],
              max: thumb === 0 ? pair.value[1] : props.max,
              step: props.step,
              disabled: props.disabled,
              readonly: props.readonly,
              'onUpdate:modelValue': (value: number | null) => update(thumb, value),
            }),
          ),
        ),
      ])
    }
  },
})
