import { resolveSpace, resolveRadius, shadowStyle } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps } from 'vue'
import {
  useButtonAction,
  cardProps,
  useMavisTheme,
  actionEmits,
} from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { usePressFeedback } from '../motion.js'

export const MCard = defineComponent({
  name: 'MCard',
  inheritAttrs: false,
  props: cardProps,
  emits: actionEmits,
  setup(props, { attrs, slots, emit }) {
    useButtonAction(() => props.interactive)
    const { theme } = useMavisTheme()
    const lifecycle = usePressFeedback(() => props.interactive && !props.disabled, theme)
    const activate = () => {
      if (props.interactive && !props.disabled) emit('click')
    }
    return () => {
      const { interactive, disabled, elevation, ...layout } = props
      const tokens = theme.value.components.card
      layout.padding ??= tokens.padding
      layout.radius ??= tokens.radius
      return h(
        MColumn,
        mergeProps(
          lifecycle,
          layout,
          {
            class: { 'm-card-interactive': interactive },
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
              boxShadow: `var(--m-card-shadow, ${shadowStyle(theme.value.elevation[elevation ?? tokens.elevation])})`,
              backgroundColor: props.backgroundColor ?? theme.value.colors.surface,
              border: `1px solid ${theme.value.colors.border}`,
              filter: interactive && disabled ? 'opacity(0.45)' : undefined,
              '--m-focus': theme.value.colors.primary,
            },
          },
          attrs,
          interactive
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
            : {},
        ),
        slots,
      )
    }
  },
})
