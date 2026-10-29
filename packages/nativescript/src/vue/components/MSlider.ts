import { isAndroid, type PropertyChangeData } from '@nativescript/core'
import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { sliderScale } from '@mavis-ui/core'

export const MSlider = defineComponent({
  name: 'MSlider',
  inheritAttrs: false,
  props: {
    modelValue: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    disabled: Boolean,
    label: { type: String, required: true },
  },
  emits: { 'update:modelValue': (_value: number) => true },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    return () => {
      const scale = sliderScale(props.min, props.max, props.step)
      const index = scale.toNative(props.modelValue)
      const value = scale.fromNative(index)
      return h(
        'Slider',
        mergeProps(
          {
            style: {
              color: theme.value.colors.primary,
              backgroundColor: theme.value.colors.border,
              minHeight: 44,
              flexShrink: 0,
              margin: 0,
            },
          },
          attrs,
          {
            minValue: isAndroid ? 0 : props.min,
            maxValue: isAndroid ? scale.steps : props.max,
            value: isAndroid ? index : value,
            isEnabled: !props.disabled,
            accessible: true,
            accessibilityRole: 'adjustable',
            accessibilityState: props.disabled ? 'disabled' : null,
            accessibilityLabel: props.label,
            accessibilityValue: String(value),
            accessibilityStep: isAndroid ? 1 : props.step,
            onValueChange: (event: PropertyChangeData) => {
              if (props.disabled) return
              const raw = Number(event.value)
              const next = scale.fromNative(isAndroid ? raw : scale.toNative(raw))
              if (next !== value) emit('update:modelValue', next)
            },
          },
        ),
      )
    }
  },
})
