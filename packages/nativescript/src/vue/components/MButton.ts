import { defineComponent, h, mergeProps } from 'nativescript-vue'
import {
  buttonProps,
  useMavisTheme,
  actionEmits,
  textContent,
  useDefaultShrink,
  viewAttrs,
} from '@mavis-ui/core/vue'
import { nonNegative } from '@mavis-ui/core'
import { usePressFeedback } from '../use-press.js'

export const MButton = defineComponent({
  name: 'MButton',
  inheritAttrs: false,
  props: buttonProps,
  emits: actionEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    const enabled = () => !props.disabled && !props.loading
    const lifecycle = usePressFeedback(enabled, theme)
    return () => {
      const { colors, control, radius } = theme.value
      const size = control[props.size]
      const primary = props.variant === 'primary'
      const text = props.loading
        ? props.loadingText
        : (props.text ?? textContent(slots.default?.()))
      return h(
        'Button',
        mergeProps(
          {
            style: {
              minHeight: size.height,
              paddingLeft: size.padding,
              paddingRight: size.padding,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: size.fontSize,
              fontWeight: '600',
              textTransform: 'none',
              backgroundColor: primary
                ? colors.primary
                : props.variant === 'secondary'
                  ? colors.elevated
                  : 'transparent',
              color: primary ? colors.onPrimary : colors.text,
              borderRadius: radius.md,
              borderWidth: 0,
              androidElevation: 0,
              androidDynamicElevationOffset: 0,
              margin: 0,
              opacity: props.disabled ? 0.45 : 1,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              minWidth: 44,
            },
          },
          viewAttrs(props),
          attrs,
          lifecycle,
          {
            text,
            isEnabled: enabled(),
            accessible: true,
            accessibilityRole: 'button',
            accessibilityState: enabled() ? null : 'disabled',
            accessibilityLabel: props.accessibilityLabel ?? text,
            accessibilityValue:
              attrs.accessibilityValue ?? (props.accessibilityLabel ? text : undefined),
            onTap: () => {
              if (enabled()) emit('click')
            },
          },
        ),
      )
    }
  },
})
