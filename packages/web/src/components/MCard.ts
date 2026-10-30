import { defineComponent, h, mergeProps } from 'vue'
import { cardProps, useMavisTheme, actionEmits } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'

export const MCard = defineComponent({
  name: 'MCard',
  inheritAttrs: false,
  props: cardProps,
  emits: actionEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const activate = () => {
      if (props.interactive && !props.disabled) emit('click')
    }
    return () => {
      const { interactive, disabled, ...layout } = props
      return h(
        MColumn,
        mergeProps(
          layout,
          {
            class: { 'm-card-interactive': interactive },
            style: {
              backgroundColor: props.backgroundColor ?? theme.value.colors.surface,
              border: `1px solid ${theme.value.colors.border}`,
              opacity: interactive && disabled ? 0.45 : 1,
              '--m-press-scale': theme.value.motion.pressScale,
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
