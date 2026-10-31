import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import {
  buttonProps,
  useMavisTheme,
  actionEmits,
  textContent,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import { nonNegative } from '@getcortexlabs/mavis-core'
import { isAndroid } from '@nativescript/core'
import { usePressFeedback } from '../use-press.js'
import { MavisButton } from '../../native/button'
import { useNativeViewAttrs } from '../accessibility.js'

registerElement('MavisButton', () => MavisButton)

export const MButton = defineComponent({
  name: 'MButton',
  inheritAttrs: false,
  props: buttonProps,
  emits: actionEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
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
        'MavisButton',
        mergeProps(
          {
            // Android builds the accessible description from the current text.
            // Apply it before updating the label/value during the same render.
            text,
            textWrap: true,
            iosAccessibilityAdjustsFontSize: true,
            style: {
              minHeight: Math.max(size.height, isAndroid ? 48 : 44),
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
              minWidth: isAndroid ? 48 : 44,
            },
          },
          nativeAttrs(),
          attrs,
          lifecycle,
          {
            isEnabled: enabled(),
            accessible: true,
            accessibilityRole: 'button',
            accessibilityState: enabled() ? '' : 'disabled',
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
