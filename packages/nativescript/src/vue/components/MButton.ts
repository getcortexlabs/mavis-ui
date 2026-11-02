import { MRow } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'
import { ActionChildren } from '../accessibility.js'
import { observeComposedButton } from '../../native/composed-button'
import {
  defineComponent,
  h,
  mergeProps,
  registerElement,
  onBeforeUnmount,
  ref,
  type VNode,
  type SlotsType,
} from 'nativescript-vue'
import {
  useButtonAction,
  buttonProps,
  buttonContent,
  ButtonAdornment,
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
import { isAndroid, type EventData, type View } from '@nativescript/core'
import { useMotionSurface } from '../use-motion-surface.js'
import { usePressFeedback } from '../use-press.js'
import { MavisButton } from '../../native/button'
import { useNativeViewAttrs } from '../accessibility.js'

registerElement('MavisButton', () => MavisButton)

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
    const nativeAttrs = useNativeViewAttrs(props)
    const shrink = useDefaultShrink()
    const enabled = () => !props.disabled && !props.loading
    const keyboardPressed = ref(false)
    const lifecycle = usePressFeedback(enabled, theme, keyboardPressed)
    const surface = useMotionSurface(() => props.motionSurface)
    const focused = ref(false)
    let releaseFocus: (() => void) | undefined
    const clearFocus = () => {
      releaseFocus?.()
      releaseFocus = undefined
      focused.value = false
    }
    onBeforeUnmount(clearFocus)
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
      const leading = buttonContent(slots.leading?.())
      const trailing = buttonContent(slots.trailing?.())
      const composed = Boolean(slots.leading || slots.trailing)
      const hasIcon = Boolean(composed || props.icon || props.trailingIcon)
      checkIconOnly(text, hasIcon, props.accessibilityLabel)
      const iconSize = iconSizes[props.size]
      const minHeight = Math.max(size.height, isAndroid ? 48 : 44)
      const paddingX = hasIcon && !text ? Math.round((minHeight - iconSize) / 2) : size.padding
      const span = (name: typeof props.icon) =>
        name
          ? h('Span', { text: iconGlyph(name), fontFamily: iconFontFamily, fontSize: iconSize })
          : null
      if (composed) {
        const tone = primary ? 'onPrimary' : 'text'
        const adornment = (children: ReturnType<typeof buttonContent>) =>
          h(
            MRow,
            {
              shrink: 0,
              align: 'center',
              accessibilityHidden: true,
              isUserInteractionEnabled: false,
            },
            { default: () => h(ButtonAdornment, {}, { default: () => children }) },
          )
        return h(
          MRow,
          mergeProps(
            {
              justify: 'center',
              align: 'center',
              wrap: true,
              gap: 8,
              style: {
                minWidth: minHeight,
                minHeight,
                margin: 0,
                paddingLeft: paddingX,
                paddingRight: paddingX,
                paddingTop: tokens.paddingY,
                paddingBottom: tokens.paddingY,
                backgroundColor: primary
                  ? colors.primary
                  : props.variant === 'secondary'
                    ? colors.elevated
                    : 'transparent',
                borderRadius: resolveRadius(theme.value, tokens.radius),
                borderWidth: focused.value ? 2 : 0,
                borderColor: colors.primary,
                boxShadow:
                  tokens.elevation === 'none'
                    ? undefined
                    : shadowStyle(theme.value.elevation[tokens.elevation], 'native'),
                opacity: props.disabled ? 0.45 : 1,
                flexGrow: nonNegative(props.grow, 'grow'),
                flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              },
            },
            nativeAttrs(),
            attrs,
            lifecycle,
            surface,
            {
              isEnabled: enabled(),
              accessible: true,
              accessibilityRole: 'button',
              accessibilityState: enabled() ? '' : 'disabled',
              accessibilityLabel: props.accessibilityLabel ?? text,
              accessibilityValue: props.accessibilityLabel ? text : undefined,
              onTap: () => {
                if (enabled()) emit('click')
              },
              onLoaded: (event: EventData) => {
                clearFocus()
                releaseFocus = observeComposedButton(
                  event.object as View,
                  (value) => {
                    focused.value = value
                  },
                  () => {
                    if (enabled()) emit('click')
                  },
                  (value) => {
                    keyboardPressed.value = value
                  },
                )
              },
              onUnloaded: clearFocus,
            },
          ),
          {
            default: () =>
              h(
                ActionChildren,
                { hidden: true },
                {
                  default: () => [
                    slots.leading
                      ? adornment(leading)
                      : props.icon
                        ? h(MIcon, { name: props.icon, size: props.size, tone })
                        : null,
                    text
                      ? h(MText, {
                          text,
                          shrink: 0,
                          tone,
                          align: 'center',
                          style: {
                            fontSize: size.fontSize,
                            fontWeight: tokens.fontWeight,
                            fontFamily: family,
                            lineHeight: size.fontSize * (tokens.lineHeight - 1),
                          },
                        })
                      : null,
                    slots.trailing
                      ? adornment(trailing)
                      : props.trailingIcon
                        ? h(MIcon, { name: props.trailingIcon, size: props.size, tone })
                        : null,
                  ],
                },
              ),
          },
        )
      }
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
          surface,
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
