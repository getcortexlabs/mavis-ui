import { defineComponent, h, mergeProps } from 'vue'
import {
  textProps,
  useMavisTheme,
  textContent,
  useDefaultShrink,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { nonNegative } from '@getcortexlabs/mavis-core'
import { webAttrs } from '../style.js'

export const MText = defineComponent({
  name: 'MText',
  inheritAttrs: false,
  props: textProps,
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
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              minWidth: 0,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
        ),
        props.text ?? textContent(slots.default?.()),
      )
    }
  },
})
