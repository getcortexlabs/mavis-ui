import { defineComponent, h, mergeProps, type PropType } from 'nativescript-vue'
import type { ButtonVariant, Size } from '@mavis-ui/core'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { usePressFeedback } from '../use-press.js'
import { textContent } from '@mavis-ui/core/vue'
import { useDefaultShrink } from '@mavis-ui/core/vue'

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
              flexGrow: props.grow,
              flexShrink: props.shrink ?? shrink,
              minWidth: 44,
            },
          },
          attrs,
          lifecycle,
          {
            text,
            isEnabled: enabled(),
            accessible: true,
            accessibilityRole: 'button',
            accessibilityState: enabled() ? null : 'disabled',
            accessibilityLabel: attrs.accessibilityLabel ?? text,
            accessibilityValue:
              attrs.accessibilityValue ?? (attrs.accessibilityLabel ? text : undefined),
            onTap: () => {
              if (enabled()) emit('click')
            },
          },
        ),
      )
    }
  },
})
