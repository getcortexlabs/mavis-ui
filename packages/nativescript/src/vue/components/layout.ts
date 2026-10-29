import {
  rowProps,
  columnProps,
  viewAttrs,
  useMavisTheme,
  layoutDirection,
  useDefaultShrink,
} from '@mavis-ui/core/vue'
import { defineComponent, h, mergeProps, provide } from 'nativescript-vue'
import { resolveSpace } from '@mavis-ui/core'
import { boxProps, boxStyle } from '../props.js'

export type { Align, Justify } from '@mavis-ui/core/vue'

const alignment = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const
const distribution = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
} as const

function createLayout(name: string, direction: 'row' | 'column') {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: direction === 'row' ? rowProps : columnProps,
    setup(props, { attrs, slots }) {
      const { theme } = useMavisTheme()
      const shrink = useDefaultShrink()
      provide(layoutDirection, direction)
      return () =>
        h(
          'FlexboxLayout',
          mergeProps(
            {
              style: {
                ...boxStyle(theme.value, props, shrink),
                flexDirection: direction,
                alignItems: alignment[props.align],
                justifyContent: distribution[props.justify],
                flexWrap: props.wrap ? 'wrap' : 'nowrap',
                gap: resolveSpace(theme.value, props.gap ?? 'none'),
              },
            },
            viewAttrs(props),
            attrs,
          ),
          slots.default?.(),
        )
    },
  })
}

export const MRow = createLayout('MRow', 'row')
export const MColumn = createLayout('MColumn', 'column')

/** Children share one cell; the last child is drawn on top. */
export const MBox = defineComponent({
  name: 'MBox',
  inheritAttrs: false,
  props: boxProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    return () =>
      h(
        'GridLayout',
        mergeProps({ style: boxStyle(theme.value, props, shrink) }, viewAttrs(props), attrs),
        slots.default?.(),
      )
  },
})
