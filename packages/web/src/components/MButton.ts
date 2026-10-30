import { defineComponent, h, mergeProps } from 'vue'
import {
  buttonProps,
  useMavisTheme,
  actionEmits,
  textContent,
  useDefaultShrink,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { nonNegative } from '@getcortexlabs/mavis-core'
import { webAttrs } from '../style.js'

export const MButton = defineComponent({
  name: 'MButton',
  inheritAttrs: false,
  props: buttonProps,
  emits: actionEmits,
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
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              minWidth: '44px',
              '--m-press-scale': motion.pressScale,
              '--m-focus': colors.primary,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
          {
            type: 'button',
            disabled: props.disabled,
            'aria-disabled': props.disabled || props.loading || undefined,
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
