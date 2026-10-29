import { defineComponent, h, mergeProps } from 'vue'
import { sliderProps, useMavisTheme, sliderEmits } from '@mavis-ui/core/vue'
import { sliderScale } from '@mavis-ui/core'
import { webAttrs } from '../style.js'

export const MSlider = defineComponent({
  name: 'MSlider',
  inheritAttrs: false,
  props: sliderProps,
  emits: sliderEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    return () => {
      const scale = sliderScale(props.min, props.max, props.step)
      const index = scale.toNative(props.modelValue)
      const value = scale.fromNative(index)
      return h(
        'input',
        mergeProps(
          {
            class: 'm-slider',
            style: {
              width: '100%',
              minWidth: 0,
              minHeight: '44px',
              margin: 0,
              flexShrink: 0,
              accentColor: theme.value.colors.primary,
              '--m-focus': theme.value.colors.primary,
              '--m-slider-color': theme.value.colors.primary,
              '--m-slider-track': theme.value.colors.muted,
              '--m-slider-progress': `${(index / scale.steps) * 100}%`,
            },
          },
          webAttrs({ ...attrs, id: props.id, accessibilityHidden: props.accessibilityHidden }),
          {
            type: 'range',
            min: 0,
            max: scale.steps,
            step: 1,
            value: index,
            disabled: props.disabled,
            'aria-label': props.label,
            'aria-valuemin': props.min,
            'aria-valuemax': props.max,
            'aria-valuenow': value,
            'aria-valuetext': String(value),
            onInput: (event: Event) => {
              if (props.disabled) return
              const input = event.target as HTMLInputElement
              const next = scale.fromNative(input.valueAsNumber)
              if (next !== value) emit('update:modelValue', next)
            },
          },
        ),
      )
    }
  },
})
