import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import {
  buttonProps,
  useMavisTheme,
  actionEmits,
  textContent,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import {
  fontFamily,
  resolveRadius,
  shadowStyle,
  nonNegative,
  iconGlyph,
  iconFontFamily,
  iconSizes,
  checkIconOnly,
} from '@getcortexlabs/mavis-core'
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
      const tokens = theme.value.components.button
      const family = fontFamily(
        tokens.fontFamily ?? theme.value.typography.body.fontFamily,
        isAndroid ? 'android' : 'ios',
      )
      const size = control[props.size]
      const primary = props.variant === 'primary'
      const text = props.loading
        ? props.loadingText
        : (props.text ?? textContent(slots.default?.()))
      const hasIcon = Boolean(props.icon || props.trailingIcon)
      checkIconOnly(text, hasIcon, props.accessibilityLabel)
      const iconSize = iconSizes[props.size]
      const minHeight = Math.max(size.height, isAndroid ? 48 : 44)
      const paddingX = hasIcon && !text ? Math.round((minHeight - iconSize) / 2) : size.padding
      const span = (name: typeof props.icon) =>
        name
          ? h('Span', { text: iconGlyph(name), fontFamily: iconFontFamily, fontSize: iconSize })
          : null
      return h(
        'MavisButton',
        mergeProps(
          {
            // Android builds the accessible description from the current text.
            // Apply it before updating the label/value during the same render.
            // Core ignores text while spans render, so the plain text keeps the description short.
            text,
            ...(hasIcon ? {} : { formattedText: null }),
            textWrap: true,
            iosAccessibilityAdjustsFontSize: true,
            style: {
              minHeight,
              paddingLeft: paddingX,
              paddingRight: paddingX,
              paddingTop: tokens.paddingY,
              paddingBottom: tokens.paddingY,
              fontSize: size.fontSize,
              fontWeight: tokens.fontWeight,
              fontFamily: family,
              lineHeight: size.fontSize * (tokens.lineHeight - 1),
              textTransform: 'none',
              backgroundColor: primary
                ? colors.primary
                : props.variant === 'secondary'
                  ? colors.elevated
                  : 'transparent',
              color: primary ? colors.onPrimary : colors.text,
              borderRadius: resolveRadius(theme.value, tokens.radius),
              boxShadow:
                tokens.elevation === 'none'
                  ? undefined
                  : shadowStyle(theme.value.elevation[tokens.elevation], 'native'),
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
        hasIcon
          ? [
              h('FormattedString', {}, [
                span(props.icon),
                text ? h('Span', { text: props.icon ? ` ${text}` : text }) : null,
                props.trailingIcon && text ? h('Span', { text: ' ' }) : null,
                span(props.trailingIcon),
              ]),
            ]
          : undefined,
      )
    }
  },
})
