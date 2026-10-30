import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import { sliderProps, useMavisTheme, sliderEmits } from '@getcortexlabs/mavis-core/vue'
import { sliderScale } from '@getcortexlabs/mavis-core'
import { isAndroid, type PropertyChangeData } from '@nativescript/core'
import { MavisSlider } from '../../native/slider.js'
import { useNativeViewAttrs } from '../accessibility.js'

registerElement('MavisSlider', () => MavisSlider)

export const MSlider = defineComponent({
  name: 'MSlider',
  inheritAttrs: false,
  props: sliderProps,
  emits: sliderEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    return () => {
      const scale = sliderScale(props.min, props.max, props.step)
      const index = scale.toNative(props.modelValue)
      const value = scale.fromNative(index)
      return h(
        'MavisSlider',
        mergeProps(
          {
            style: {
              color: theme.value.colors.primary,
              backgroundColor: theme.value.colors.muted,
              minHeight: isAndroid ? 48 : 44,
              flexShrink: 0,
              margin: 0,
            },
          },
          attrs,
          nativeAttrs(),
          {
            id: props.id,
            minValue: isAndroid ? 0 : props.min,
            maxValue: isAndroid ? scale.steps : props.max,
            value: isAndroid ? index : value,
            ...(isAndroid
              ? {
                  semanticRange: {
                    min: props.min,
                    max: props.max,
                    step: props.step,
                    value,
                    label: props.label,
                  },
                }
              : {}),
            isEnabled: !props.disabled,
            accessible: true,
            accessibilityRole: 'adjustable',
            accessibilityState: props.disabled ? 'disabled' : '',
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
