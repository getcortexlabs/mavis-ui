import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import {
  textProps,
  useMavisTheme,
  textContent,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import { nonNegative } from '@getcortexlabs/mavis-core'
import { MavisLabel } from '../../native/label.js'
import { useNativeViewAttrs } from '../accessibility.js'

registerElement('MavisLabel', () => MavisLabel)

export const MText = defineComponent({
  name: 'MText',
  inheritAttrs: false,
  props: textProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const shrink = useDefaultShrink()
    return () =>
      h(
        'MavisLabel',
        mergeProps(
          {
            text: props.text ?? textContent(slots.default?.()),
            textWrap: props.wrap,
            iosAccessibilityAdjustsFontSize: true,
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
          nativeAttrs(),
          attrs,
        ),
      )
  },
})
