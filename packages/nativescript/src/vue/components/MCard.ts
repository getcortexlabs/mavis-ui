import { defineComponent, h, mergeProps, type PropType } from 'nativescript-vue'
import { MColumn } from './layout.js'
import { boxProps, spacingProp } from '../props.js'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { usePressFeedback } from '../use-press.js'
import type { Spacing, Radius } from '@mavis-ui/core'

export const MCard = defineComponent({
  name: 'MCard',
  inheritAttrs: false,
  props: {
    ...boxProps,
    padding: { type: [String, Number] as PropType<Spacing>, default: 'lg' },
    radius: { type: [String, Number] as PropType<Radius | number>, default: 'lg' },
    gap: spacingProp,
    interactive: Boolean,
    disabled: Boolean,
  },
  emits: { click: () => true },
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
