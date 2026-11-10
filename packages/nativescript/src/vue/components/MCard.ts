import { nativeDestination, navigateNative } from '../navigation.js'
import { resolveSpace, resolveRadius, shadowStyle } from '@getcortexlabs/mavis-core'
import { ActionChildren } from '../accessibility.js'
import { defineComponent, getCurrentInstance, h, mergeProps } from 'nativescript-vue'
import {
  useButtonAction,
  cardProps,
  useMavisTheme,
  useNavigationOptions,
  actionEmits,
} from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { usePressFeedback } from '../use-press.js'
import { useMotionSurface } from '../use-motion-surface.js'

export const MCard = defineComponent({
  name: 'MCard',
  inheritAttrs: false,
  props: cardProps,
  emits: actionEmits,
  setup(props, { attrs, slots, emit }) {
    useButtonAction(() => props.interactive || props.href !== undefined)
    const { theme } = useMavisTheme()
    const navigation = useNavigationOptions(props)
    const instance = getCurrentInstance()
    const enabled = () => (props.interactive || props.href !== undefined) && !props.disabled
    const lifecycle = usePressFeedback(enabled, theme)
    const { allowsActivation, ...surface } = useMotionSurface(
      () => props.motionSurface,
      () => !props.disabled,
    )
    return () => {
      const {
        interactive: action,
        disabled,
        elevation,
        motionSurface,
        href,
        navigate,
        target,
        rel,
        ...layout
      } = props
      const interactive = action || href !== undefined
      // A labelled card with no action wired is read as one element, like a labelled action.
      // An explicit accessible attribute decides otherwise.
      const summary =
        !interactive &&
        (attrs.accessible === undefined
          ? Boolean(props.accessibilityLabel) && !instance?.vnode.props?.onClick
          : attrs.accessible !== false && attrs.accessible !== 'false')
      if (href !== undefined) nativeDestination(navigation())
      const tokens = theme.value.components.card
      layout.padding ??= tokens.padding
      layout.radius ??= tokens.radius
      return h(
        MColumn,
        mergeProps(
          layout,
          {
            style: {
              boxShadow:
                (elevation ?? tokens.elevation) === 'none'
                  ? undefined
                  : shadowStyle(theme.value.elevation[elevation ?? tokens.elevation], 'native'),
              backgroundColor: props.backgroundColor ?? theme.value.colors.surface,
              borderColor: theme.value.colors.border,
              borderWidth: 1,
              opacity: interactive && disabled ? 0.45 : 1,
            },
          },
          attrs,
          lifecycle,
          surface,
          {
            accessible: interactive || summary,
            accessibilityRole: href !== undefined ? 'link' : interactive ? 'button' : '',
            accessibilityState: interactive && disabled ? 'disabled' : '',
            onTap: interactive
              ? () => {
                  if (enabled() && allowsActivation()) {
                    emit('click')
                    if (href !== undefined)
                      void navigateNative(navigation()).catch((error) => emit('error', error))
                  }
                }
              : undefined,
          },
        ),
        {
          default: () =>
            h(
              ActionChildren,
              { hidden: (interactive || summary) && Boolean(props.accessibilityLabel) },
              slots,
            ),
        },
      )
    }
  },
})
