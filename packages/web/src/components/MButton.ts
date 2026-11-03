import { defineComponent, h, mergeProps, type VNode, type SlotsType } from 'vue'
import {
  useButtonAction,
  buttonProps,
  buttonContent,
  ButtonAdornment,
  useMavisTheme,
  actionEmits,
  textContent,
  useLayoutShrink,
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
import { usePressFeedback } from '../motion.js'
import { navigationAttrs } from '../navigation.js'
import { LoadingDecoration } from './LoadingDecoration.js'

export const MButton = defineComponent({
  name: 'MButton',
  inheritAttrs: false,
  props: buttonProps,
  emits: actionEmits,
  slots: Object as SlotsType<{
    default?: () => VNode[]
    leading?: () => VNode[]
    trailing?: () => VNode[]
  }>,
  setup(props, { attrs, slots, emit }) {
    useButtonAction()
    const { theme } = useMavisTheme()
    const lifecycle = usePressFeedback(
      () => !props.disabled && !props.loading,
      theme,
      () => props.motionSurface,
    )
    const shrink = useLayoutShrink()
    return () => {
      const { colors, control } = theme.value
      const tokens = theme.value.components.button
      const family = fontFamily(tokens.fontFamily ?? theme.value.typography.body.fontFamily, 'web')
      const size = control[props.size]
      const primary = props.variant === 'primary'
      const text = props.loading
        ? props.loadingText
        : (props.text ?? textContent(slots.default?.()))
      const leading = buttonContent(slots.leading?.())
      const trailing = buttonContent(slots.trailing?.())
      const composed = Boolean(slots.leading || slots.trailing)
      const indicator = props.loading && props.loadingIndicator !== 'none'
      const hasIcon = Boolean(composed || props.icon || props.trailingIcon || indicator)
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
        props.href === undefined ? 'button' : 'a',
        mergeProps(
          lifecycle,
          {
            class: 'm-button',
            style: {
              boxSizing: 'border-box',
              display: 'inline-flex',
              flexWrap: composed ? 'wrap' : undefined,
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
              textDecoration: 'none',
              filter: props.disabled ? 'opacity(0.45)' : undefined,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink.value, 'shrink'),
              minWidth: '44px',
              '--m-focus': colors.primary,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
          {
            type: props.href === undefined ? props.type : undefined,
            name: props.name,
            value: props.value,
            form: props.form,
            disabled: props.href === undefined ? props.disabled : undefined,
            'aria-disabled': props.disabled || props.loading || undefined,
            'aria-busy': props.loading || undefined,
            onClick: (event: MouseEvent) => {
              if (props.disabled || props.loading) {
                event.preventDefault()
                return
              }
              if (props.href === undefined && !event.defaultPrevented) emit('click')
            },
          },
          props.href === undefined
            ? {}
            : navigationAttrs(
                props,
                props.disabled || props.loading,
                () => emit('click'),
                (error) => emit('error', error),
              ),
        ),
        hasIcon
          ? [
              ...(indicator
                ? [
                    h(LoadingDecoration, {
                      kind: props.loadingIndicator as 'dots' | 'bars' | 'ring',
                      width: iconSize,
                      height: iconSize,
                      size: iconSize,
                      color: primary ? colors.onPrimary : colors.text,
                      radius: 'none',
                    }),
                  ]
                : []),
              slots.leading
                ? h('span', { class: 'm-button-adornment', 'aria-hidden': 'true', inert: '' }, [
                    h(ButtonAdornment, {}, { default: () => leading }),
                  ])
                : span(props.icon),
              text
                ? h(
                    'span',
                    {
                      class: 'm-button-label',
                      style: { minWidth: 0, maxWidth: '100%', overflowWrap: 'break-word' },
                    },
                    text,
                  )
                : null,
              slots.trailing
                ? h('span', { class: 'm-button-adornment', 'aria-hidden': 'true', inert: '' }, [
                    h(ButtonAdornment, {}, { default: () => trailing }),
                  ])
                : span(props.trailingIcon),
            ]
          : text,
      )
    }
  },
})
