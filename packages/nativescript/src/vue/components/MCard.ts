import { defineComponent, h, mergeProps, type PropType } from 'nativescript-vue'
import { MColumn } from './layout.js'
import { boxProps, spacingProp } from '../props.js'
import { useMavisTheme } from '@mavis-ui/core/vue'
import type { Spacing, Radius } from '@mavis-ui/core'

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
              borderColor: theme.value.colors.border,
              borderWidth: 1,
            },
          },
          attrs,
        ),
        slots,
      )
  },
})
