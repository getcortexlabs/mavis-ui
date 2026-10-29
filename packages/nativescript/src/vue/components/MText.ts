import { defineComponent, h, mergeProps, type PropType } from 'nativescript-vue'
import type { Palette, TextVariant } from '@mavis-ui/core'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { textContent } from '@mavis-ui/core/vue'
import { useDefaultShrink } from '@mavis-ui/core/vue'

export const MText = defineComponent({
  name: 'MText',
  inheritAttrs: false,
  props: {
    as: {
      type: String as PropType<'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>,
      default: 'p',
    },
    text: { type: String, default: undefined },
    variant: { type: String as PropType<TextVariant>, default: 'body' },
    tone: { type: String as PropType<keyof Palette>, default: 'text' },
    align: { type: String as PropType<'left' | 'center' | 'right'>, default: 'left' },
    wrap: { type: Boolean, default: true },
    grow: { type: Number, default: 0 },
    shrink: { type: Number, default: undefined },
  },
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
              flexGrow: props.grow,
              flexShrink: props.shrink ?? shrink,
              minWidth: 0,
            },
          },
          attrs,
        ),
      )
  },
})
