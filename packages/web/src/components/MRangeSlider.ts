import { computed, defineComponent, h, mergeProps, nextTick, useId } from 'vue'
import { moveRange, rangeValue, sliderScale, type RangeValue } from '@getcortexlabs/mavis-core'
import { rangeSliderProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { useHydrationEdit } from '../hydration.js'
export const MRangeSlider = defineComponent({
  name: 'MRangeSlider',
  inheritAttrs: false,
  props: rangeSliderProps,
  emits: { 'update:modelValue': (_value: RangeValue) => true },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const id = `m-range-${useId()}`
    const pair = computed(() => rangeValue(props.modelValue, props.min, props.max, props.step))
    const format = (value: number) => props.formatValue?.(value) ?? String(value)
    const pending = useHydrationEdit(
      (root) => {
        if (props.disabled || props.readonly) return
        const inputs = [...root.querySelectorAll<HTMLInputElement>('input[type="range"]')]
        if (inputs.length !== 2) return
        const scale = sliderScale(props.min, props.max, props.step)
        if (
          !inputs.every(
            (input, thumb) => Number(input.defaultValue) === scale.toNative(pair.value[thumb]!),
          )
        )
          return
        if (inputs.every((input) => input.value === input.defaultValue)) return
        const upper = scale.fromNative(inputs[1]!.valueAsNumber)
        const value: [number, number] = [
          Math.min(scale.fromNative(inputs[0]!.valueAsNumber), upper),
          upper,
        ]
        // Match the hydrated value attribute to the user's existing edit. Paint and
        // accessible values update together after the owner accepts the pair.
        inputs.forEach((input, thumb) => {
          input.defaultValue = String(scale.toNative(value[thumb]!))
        })
        return value
      },
      (value) => emit('update:modelValue', value),
    )
    return () => {
      const scale = sliderScale(props.min, props.max, props.step)
      const shown = pending() ?? pair.value
      const lower = scale.toNative(pair.value[0]),
        upper = scale.toNative(pair.value[1])
      return h(
        MColumn,
        mergeProps({ id: props.id, gap: 'sm' }, attrs, {
          class: 'm-range-slider',
          role: 'group',
          'aria-labelledby': id,
          style: {
            '--m-range-color': theme.value.colors.primary,
            '--m-range-track': theme.value.colors.border,
            '--m-range-surface': theme.value.colors.surface,
            '--m-range-from': `${(lower / scale.steps) * 100}%`,
            '--m-range-to': `${(upper / scale.steps) * 100}%`,
          },
        }),
        () => [
          h(MRow, { justify: 'between', gap: 'md', wrap: true }, () => [
            h(MText, { id, text: props.label, weight: '600' }),
            h(MText, {
              text: `${format(pair.value[0])} – ${format(pair.value[1])}`,
              tone: 'muted',
            }),
          ]),
          h(
            'div',
            { class: 'm-range-track' },
            ([0, 1] as const).map((thumb) =>
              h('input', {
                type: 'range',
                min: 0,
                max: scale.steps,
                step: 1,
                value: scale.toNative(shown[thumb]),
                disabled: props.disabled,
                'aria-readonly': props.readonly || undefined,
                'aria-label': `${props.label}: ${thumb === 0 ? props.lowerLabel : props.upperLabel}`,
                'aria-valuemin': thumb === 0 ? props.min : pair.value[0],
                'aria-valuemax': thumb === 0 ? pair.value[1] : props.max,
                'aria-valuenow': pair.value[thumb],
                'aria-valuetext': format(pair.value[thumb]),
                style: { zIndex: thumb === 0 && lower === scale.steps ? 3 : thumb + 1 },
                onKeydown: (event: KeyboardEvent) => {
                  if (props.readonly) event.preventDefault()
                },
                onInput: (event: Event) => {
                  const input = event.target as HTMLInputElement
                  const next = moveRange(
                    pair.value,
                    thumb,
                    scale.fromNative(input.valueAsNumber),
                    props.min,
                    props.max,
                    props.step,
                  )
                  if (!props.disabled && !props.readonly && next[thumb] !== pair.value[thumb])
                    emit('update:modelValue', next)
                  void nextTick(() => {
                    input.value = String(scale.toNative(pair.value[thumb]))
                  })
                },
              }),
            ),
          ),
        ],
      )
    }
  },
})
