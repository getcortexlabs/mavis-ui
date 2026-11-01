import { defineComponent, h, mergeProps } from 'vue'
import { separatorProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { resolveSpace } from '@getcortexlabs/mavis-core'
import { MBox } from './layout.js'

export const MSeparator = defineComponent({
  name: 'MSeparator',
  inheritAttrs: false,
  props: separatorProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    return () => {
      const vertical = props.orientation === 'vertical'
      const spacing = resolveSpace(theme.value, props.spacing)
      const inset = resolveSpace(theme.value, props.inset)
      const x = vertical ? spacing : inset,
        y = vertical ? inset : spacing
      return h(
        MBox,
        mergeProps(attrs, {
          id: props.id,
          width: vertical ? 1 : props.length,
          height: vertical ? props.length : 1,
          shrink: 0,
          backgroundColor: theme.value.colors.border,
          accessibilityHidden: true,
          tabindex: undefined,
          style: {
            alignSelf: props.length === undefined ? 'stretch' : 'center',
            marginLeft: `${x}px`,
            marginRight: `${x}px`,
            marginTop: `${y}px`,
            marginBottom: `${y}px`,
            pointerEvents: 'none',
          },
        }),
      )
    }
  },
})
