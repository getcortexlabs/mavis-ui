import { defineComponent, h, mergeProps } from 'nativescript-vue'
import {
  textProps,
  useMavisTheme,
  textContent,
  useDefaultShrink,
  viewAttrs,
} from '@mavis-ui/core/vue'
import { nonNegative } from '@mavis-ui/core'

export const MText = defineComponent({
  name: 'MText',
  inheritAttrs: false,
  props: textProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    return () =>
      h(
        'Label',
        mergeProps(
          {
            text: props.text ?? textContent(slots.default?.()),
            textWrap: props.wrap,
            accessible: true,
            accessibilityRole: /^h[1-6]$/.test(props.as) ? 'header' : 'text',
            style: {
              ...theme.value.typography[props.variant],
              color: theme.value.colors[props.tone],
              textAlignment: props.align,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              minWidth: 0,
            },
          },
          viewAttrs(props),
          attrs,
        ),
      )
  },
})
