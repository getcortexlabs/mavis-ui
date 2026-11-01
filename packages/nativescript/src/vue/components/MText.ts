import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import {
  textProps,
  useMavisTheme,
  inlineContent,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import { fontFamily, nonNegative, validateWeight } from '@getcortexlabs/mavis-core'
import { isAndroid } from '@nativescript/core'
import { MavisLabel } from '../../native/label'
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
    return () => {
      const type = theme.value.typography[props.variant]
      const runs =
        props.text !== undefined ? [{ text: props.text }] : inlineContent(slots.default?.())
      const text = runs.map((run) => run.text).join('')
      const formatted = runs.some((run) => run.weight || run.tone || run.strong || run.italic)
      return h(
        'MavisLabel',
        mergeProps(
          {
            text,
            ...(formatted ? {} : { formattedText: null }),
            textWrap: props.wrap,
            iosAccessibilityAdjustsFontSize: true,
            dynamicTypeStyle: props.variant,
            accessible: true,
            accessibilityRole: /^h[1-6]$/.test(props.as) ? 'header' : 'text',
            style: {
              ...type,
              fontFamily: fontFamily(type.fontFamily, isAndroid ? 'android' : 'ios'),
              fontWeight: props.weight ? validateWeight(props.weight) : type.fontWeight,
              // Core's lineHeight is additional leading in device-independent units.
              lineHeight: type.fontSize * (type.lineHeight - 1),
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
        formatted
          ? [
              h(
                'FormattedString',
                {},
                runs.map((run) => {
                  if (run.tone && !(run.tone in theme.value.colors))
                    throw new RangeError(`Unknown text tone: ${run.tone}`)
                  return h('Span', {
                    text: run.text,
                    fontWeight: run.weight,
                    fontStyle: run.italic ? 'italic' : undefined,
                    color: run.tone ? theme.value.colors[run.tone] : undefined,
                  })
                }),
              ),
            ]
          : undefined,
      )
    }
  },
})
