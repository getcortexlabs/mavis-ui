import { defineComponent, h, mergeProps, type PropType } from 'vue'
import { textContent, useDefaultShrink, useMavisTheme } from '@mavis-ui/core/vue'
import type { Palette, TextVariant } from '@mavis-ui/core'
import { webAttrs } from '../style.js'

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
    return () => {
      const type = theme.value.typography[props.variant]
      return h(
        props.as,
        mergeProps(
          {
            style: {
              margin: 0,
              fontSize: `${type.fontSize}px`,
              fontWeight: type.fontWeight,
              letterSpacing: `${type.letterSpacing}em`,
              lineHeight: 1.3,
              color: theme.value.colors[props.tone],
              textAlign: props.align,
              whiteSpace: props.wrap ? 'normal' : 'nowrap',
              overflowWrap: 'anywhere',
              flexGrow: props.grow,
              flexShrink: props.shrink ?? shrink,
              minWidth: 0,
            },
          },
          webAttrs(attrs),
        ),
        props.text ?? textContent(slots.default?.()),
      )
    }
  },
})
