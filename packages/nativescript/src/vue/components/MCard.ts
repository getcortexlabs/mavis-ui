import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { cardProps, useMavisTheme, actionEmits } from '@mavis-ui/core/vue'
import { MColumn } from './layout.js'
import { usePressFeedback } from '../use-press.js'

export const MCard = defineComponent({
  name: 'MCard',
  inheritAttrs: false,
  props: cardProps,
  emits: actionEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const enabled = () => props.interactive && !props.disabled
    const lifecycle = usePressFeedback(enabled, theme)
    return () => {
      const { interactive, disabled, ...layout } = props
      return h(
        MColumn,
        mergeProps(
          layout,
          {
            style: {
              backgroundColor: props.backgroundColor ?? theme.value.colors.surface,
              borderColor: theme.value.colors.border,
              borderWidth: 1,
              opacity: interactive && disabled ? 0.45 : 1,
            },
          },
          attrs,
          lifecycle,
          {
            accessible: interactive,
            accessibilityRole: interactive ? 'button' : undefined,
            accessibilityState: interactive && disabled ? 'disabled' : null,
            onTap: interactive
              ? () => {
                  if (enabled()) emit('click')
                }
              : undefined,
          },
        ),
        slots,
      )
    }
  },
})
