import { defineComponent, h, mergeProps } from 'vue'
import {
  buttonProps,
  useMavisTheme,
  actionEmits,
  textContent,
  useDefaultShrink,
  viewAttrs,
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
import { webAttrs } from '../style.js'
import { pressStyle } from '../motion.js'

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
      const tokens = theme.value.components.button
      const family = fontFamily(tokens.fontFamily ?? theme.value.typography.body.fontFamily, 'web')
      const size = control[props.size]
      const primary = props.variant === 'primary'
      const text = props.loading
        ? props.loadingText
        : (props.text ?? textContent(slots.default?.()))
      const hasIcon = Boolean(props.icon || props.trailingIcon)
      checkIconOnly(text, hasIcon, props.accessibilityLabel)
      const iconSize = iconSizes[props.size]
      const paddingX = hasIcon && !text ? Math.round((size.height - iconSize) / 2) : size.padding
      const span = (name: typeof props.icon) =>
        name
          ? h(
              'span',
              {
                class: 'm-icon',
                'aria-hidden': 'true',
                style: {
                  fontFamily: iconFontFamily,
                  fontSize: `${iconSize}px`,
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                },
              },
              iconGlyph(name),
            )
          : null
      return h(
        'button',
        mergeProps(
          {
            class: 'm-button',
            style: {
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: hasIcon ? '8px' : undefined,
              minHeight: `${size.height}px`,
              padding: `var(--m-button-padding-y, ${tokens.paddingY}px) var(--m-button-padding-x, ${paddingX}px)`,
              fontSize: `var(--m-button-font-size, ${size.fontSize}px)`,
              fontWeight: `var(--m-button-font-weight, ${tokens.fontWeight})`,
              fontFamily: `var(--m-button-font-family, ${family})`,
              lineHeight: `var(--m-button-line-height, ${tokens.lineHeight})`,
              backgroundColor: primary
                ? colors.primary
                : props.variant === 'secondary'
                  ? colors.elevated
                  : 'transparent',
              color: primary ? colors.onPrimary : colors.text,
              borderRadius: `var(--m-button-radius, ${resolveRadius(theme.value, tokens.radius)}px)`,
              boxShadow: `var(--m-button-shadow, ${shadowStyle(theme.value.elevation[tokens.elevation])})`,
              border: 0,
              margin: 0,
              opacity: props.disabled ? 0.45 : 1,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              minWidth: '44px',
              ...pressStyle(motion.pressScale),
              '--m-focus': colors.primary,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
          {
            type: props.type,
            name: props.name,
            value: props.value,
            form: props.form,
            disabled: props.disabled,
            'aria-disabled': props.disabled || props.loading || undefined,
            'aria-busy': props.loading || undefined,
            onClick: (event: MouseEvent) => {
              if (props.disabled || props.loading) {
                event.preventDefault()
                return
              }
              emit('click')
            },
          },
        ),
        hasIcon
          ? [span(props.icon), text ? h('span', {}, text) : null, span(props.trailingIcon)]
          : text,
      )
    }
  },
})
