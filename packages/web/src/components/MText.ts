import { defineComponent, h, mergeProps } from 'vue'
import {
  textProps,
  useMavisTheme,
  inlineContent,
  useDefaultShrink,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { fontFamily, nonNegative, validateWeight } from '@getcortexlabs/mavis-core'
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
      const runs =
        props.text !== undefined ? [{ text: props.text }] : inlineContent(slots.default?.())
      return h(
        props.as,
        mergeProps(
          {
            class: 'm-text',
            style: {
              margin: 0,
              fontFamily: `var(--m-text-font-family, ${fontFamily(type.fontFamily, 'web')})`,
              fontSize: `var(--m-text-font-size, ${type.fontSize}px)`,
              fontWeight: props.weight
                ? validateWeight(props.weight)
                : `var(--m-text-font-weight, ${type.fontWeight})`,
              letterSpacing: `var(--m-text-letter-spacing, ${type.letterSpacing}em)`,
              lineHeight: `var(--m-text-line-height, ${type.lineHeight})`,
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
        runs.every((run) => !run.weight && !run.tone && !run.strong && !run.italic)
          ? runs.map((run) => run.text).join('')
          : runs.map((run) => {
              if (!run.weight && !run.tone && !run.strong && !run.italic) return run.text
              if (run.tone && !(run.tone in theme.value.colors))
                throw new RangeError(`Unknown text tone: ${run.tone}`)
              const content = run.strong && run.italic ? h('em', {}, run.text) : run.text
              return h(
                run.strong ? 'strong' : run.italic ? 'em' : 'span',
                {
                  style: {
                    fontWeight: run.weight ?? 'inherit',
                    color: run.tone ? theme.value.colors[run.tone] : undefined,
                  },
                },
                content,
              )
            }),
      )
    }
  },
})
