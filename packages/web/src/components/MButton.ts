import { defineComponent, h, mergeProps, type PropType } from 'vue'
import { textContent, useDefaultShrink, useMavisTheme } from '@mavis-ui/core/vue'
import type { ButtonVariant, Size } from '@mavis-ui/core'
import { webAttrs } from '../style.js'

export const MButton = defineComponent({
  name: 'MButton',
  inheritAttrs: false,
  props: {
    text: { type: String, default: undefined },
    variant: { type: String as PropType<ButtonVariant>, default: 'primary' },
    size: { type: String as PropType<Size>, default: 'md' },
    disabled: Boolean,
    loading: Boolean,
    loadingText: { type: String, default: 'Loading…' },
    grow: { type: Number, default: 0 },
    shrink: { type: Number, default: undefined },
  },
  emits: { click: () => true },
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    return () => {
      const { colors, control, radius, motion } = theme.value
      const size = control[props.size]
      const primary = props.variant === 'primary'
      const text = props.loading
        ? props.loadingText
        : (props.text ?? textContent(slots.default?.()))
      return h(
        'button',
        mergeProps(
          {
            class: 'm-button',
            style: {
              boxSizing: 'border-box',
              minHeight: `${size.height}px`,
              padding: `12px ${size.padding}px`,
              fontSize: `${size.fontSize}px`,
              fontWeight: 600,
              fontFamily: 'inherit',
              lineHeight: 1.3,
              backgroundColor: primary
                ? colors.primary
                : props.variant === 'secondary'
                  ? colors.elevated
                  : 'transparent',
              color: primary ? colors.onPrimary : colors.text,
              borderRadius: `${radius.md}px`,
              border: 0,
              margin: 0,
              opacity: props.disabled ? 0.45 : 1,
              flexGrow: props.grow,
              flexShrink: props.shrink ?? shrink,
              minWidth: '44px',
              '--m-press-scale': motion.pressScale,
              '--m-focus': colors.primary,
            },
          },
          webAttrs(attrs),
          {
            type: 'button',
            disabled: props.disabled || props.loading,
            'aria-busy': props.loading || undefined,
            onClick: () => {
              if (!props.disabled && !props.loading) emit('click')
            },
          },
        ),
        text,
      )
    }
  },
})
