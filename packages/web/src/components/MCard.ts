import { defineComponent, h, mergeProps, type PropType } from 'vue'
import { boxProps, spacingProp, useMavisTheme } from '@mavis-ui/core/vue'
import type { Spacing, Radius } from '@mavis-ui/core'
import { MColumn } from './layout.js'

export const MCard = defineComponent({
  name: 'MCard',
  inheritAttrs: false,
  props: {
    ...boxProps,
    padding: { type: [String, Number] as PropType<Spacing>, default: 'lg' },
    radius: { type: [String, Number] as PropType<Radius | number>, default: 'lg' },
    gap: spacingProp,
  },
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    return () =>
      h(
        MColumn,
        mergeProps(
          props,
          {
            style: {
              backgroundColor: theme.value.colors.surface,
              border: `1px solid ${theme.value.colors.border}`,
            },
          },
          attrs,
        ),
        slots,
      )
  },
})
