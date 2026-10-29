import { defineComponent, h, mergeProps, type PropType } from 'nativescript-vue'
import type { Palette, TextVariant } from '../../theme/types.js'
import { useMavisTheme } from '../theme.js'
import { textContent } from '../text-content.js'
import { useDefaultShrink } from '../layout-context.js'

export const MText = defineComponent({
  name: 'MText',
  inheritAttrs: false,
  props: {
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
