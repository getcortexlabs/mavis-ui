import { resolveSpace, resolveRadius, shadowStyle } from '@getcortexlabs/mavis-core'
import {
  defineComponent,
  getCurrentInstance,
  h,
  mergeProps,
  shallowRef,
  useId,
  type VNode,
} from 'vue'
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

/** A control owns clicks from its descendants; the surrounding card owns the remaining surface. */
function ownsClick(event?: MouseEvent) {
  if (!event) return true
  if (event.defaultPrevented) return false
  const element = event.currentTarget as HTMLElement | null
  const Element = element?.ownerDocument.defaultView?.Element
  if (!element || !Element) return event.target === event.currentTarget
  for (const node of event.composedPath()) {
    if (node === element) return true
    if (
      node instanceof Element &&
      node.matches(
        'button, a[href], input, select, textarea, label, [contenteditable]:not([contenteditable="false"]), [tabindex], [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="tab"], [role="combobox"]',
      )
    )
      return false
  }
  return false
}

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
    const contentId = `m-card-content-${useId()}`
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
      const separateAction = interactive && href === undefined
      const { 'aria-label': explicitLabel, ...cardAttrs } = attrs
      const label = props.accessibilityLabel ?? (explicitLabel as string | undefined)
      if (separateAction) layout.accessibilityLabel = undefined
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
            'data-m-card-interactive': separateAction || undefined,
            style: {
              position: 'relative',
              isolation: 'isolate',
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
          separateAction ? cardAttrs : attrs,
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
                  onClick: (event: MouseEvent) => {
                    if (ownsClick(event)) activate()
                  },
                }
              : // A labelled card with no action wired is read as one element, as on native.
                props.accessibilityLabel &&
                  attrs.role === undefined &&
                  !instance?.vnode.props?.onClick
                ? { role: 'img' }
                : {},
        ),
        href !== undefined
          ? slots
          : {
              ...slots,
              default: () => [
                separateAction
                  ? h('button', {
                      key: 'action',
                      class: 'm-card-action',
                      type: 'button',
                      role: 'button',
                      tabindex: disabled ? -1 : 0,
                      disabled,
                      'aria-disabled': disabled || undefined,
                      'aria-label': label,
                      'aria-labelledby': label ? undefined : contentId,
                      onClick: activate,
                    })
                  : null,
                h(
                  'div',
                  {
                    key: 'content',
                    id: contentId,
                    class: 'm-card-content',
                    style: { display: 'contents' },
                  },
                  slots.default?.(),
                ),
              ],
            },
      )
    }
  },
})
