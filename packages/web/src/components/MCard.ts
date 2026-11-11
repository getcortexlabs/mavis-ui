import { resolveSpace, resolveRadius, shadowStyle } from '@getcortexlabs/mavis-core'
import { defineComponent, getCurrentInstance, h, mergeProps, shallowRef, type VNode } from 'vue'
import { preserveBoundPaint } from '../motion-surface.js'
import {
  useButtonAction,
  cardProps,
  useMavisTheme,
  useNavigationOptions,
  actionEmits,
} from '@getcortexlabs/mavis-core/vue'
import { MColumn, createLayout } from './layout.js'
import { navigationAttrs } from '../navigation.js'
import { usePressFeedback } from '../motion.js'

const LinkColumn = createLayout('MCardLink', 'column', 'a')

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
    const element = shallowRef<HTMLElement>()
    const lifecycle = usePressFeedback(
      () => (props.interactive || props.href !== undefined) && !props.disabled,
      theme,
      () => props.motionSurface,
      () => !props.disabled,
    )
    const activate = () => {
      if ((props.interactive || props.href !== undefined) && !props.disabled) emit('click')
    }
    return () => {
      const {
        interactive,
        disabled,
        elevation,
        motionSurface,
        href,
        navigate,
        target,
        rel,
        ...layout
      } = props
      const tokens = theme.value.components.card
      const shadow = `var(--m-card-shadow, ${shadowStyle(theme.value.elevation[elevation ?? tokens.elevation])})`
      layout.padding ??= tokens.padding
      layout.radius ??= tokens.radius
      return h(
        href === undefined ? MColumn : LinkColumn,
        mergeProps(
          lifecycle,
          layout,
          {
            class: 'm-card',
            style: {
              paddingLeft:
                props.paddingX !== undefined || props.padding !== undefined
                  ? `${resolveSpace(theme.value, props.paddingX ?? props.padding!)}px`
                  : `var(--m-card-padding, ${resolveSpace(theme.value, tokens.padding)}px)`,
              paddingRight:
                props.paddingX !== undefined || props.padding !== undefined
                  ? `${resolveSpace(theme.value, props.paddingX ?? props.padding!)}px`
                  : `var(--m-card-padding, ${resolveSpace(theme.value, tokens.padding)}px)`,
              paddingTop:
                props.paddingY !== undefined || props.padding !== undefined
                  ? `${resolveSpace(theme.value, props.paddingY ?? props.padding!)}px`
                  : `var(--m-card-padding, ${resolveSpace(theme.value, tokens.padding)}px)`,
              paddingBottom:
                props.paddingY !== undefined || props.padding !== undefined
                  ? `${resolveSpace(theme.value, props.paddingY ?? props.padding!)}px`
                  : `var(--m-card-padding, ${resolveSpace(theme.value, tokens.padding)}px)`,
              borderRadius:
                props.radius !== undefined
                  ? `${resolveRadius(theme.value, props.radius)}px`
                  : `var(--m-card-radius, ${resolveRadius(theme.value, tokens.radius)}px)`,
              boxShadow: shadow,
              backgroundColor:
                props.backgroundColor ?? `var(--m-card-background, ${theme.value.colors.surface})`,
              border: `var(--m-card-border, 1px solid ${theme.value.colors.border})`,
              filter: interactive && disabled ? 'opacity(0.45)' : undefined,
              '--m-focus': theme.value.colors.primary,
              textDecoration: 'none',
              color: 'inherit',
            },
          },
          attrs,
          {
            onVnodeMounted: (node: VNode) => {
              element.value = node.el as HTMLElement
            },
            style: preserveBoundPaint(element.value, shadow),
          },
          href !== undefined
            ? navigationAttrs(navigation(), disabled, activate, (error) => emit('error', error))
            : interactive
              ? {
                  role: 'button',
                  tabindex: disabled ? -1 : 0,
                  'aria-disabled': disabled || undefined,
                  onClick: activate,
                  onKeydown: (event: KeyboardEvent) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') event.preventDefault()
                    if (event.key === 'Enter' && !event.repeat) activate()
                  },
                  onKeyup: (event: KeyboardEvent) => {
                    if (event.target === event.currentTarget && event.key === ' ') {
                      event.preventDefault()
                      activate()
                    }
                  },
                }
              : // A labelled card with no action wired is read as one element, as on native.
                props.accessibilityLabel &&
                  attrs.role === undefined &&
                  !instance?.vnode.props?.onClick
                ? { role: 'img' }
                : {},
        ),
        slots,
      )
    }
  },
})
