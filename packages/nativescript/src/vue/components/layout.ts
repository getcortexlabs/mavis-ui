import { defineComponent, h, mergeProps, provide, type PropType } from 'nativescript-vue'
import { resolveSpace } from '../../theme/resolve.js'
import { useMavisTheme } from '../theme.js'
import { boxProps, boxStyle, spacingProp } from '../props.js'
import { layoutDirection, useDefaultShrink } from '../layout-context.js'

export type Align = 'start' | 'center' | 'end' | 'stretch'
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

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
    props: {
      ...boxProps,
      gap: spacingProp,
      align: {
        type: String as PropType<Align>,
        default: direction === 'row' ? 'center' : 'stretch',
      },
      justify: { type: String as PropType<Justify>, default: 'start' },
      wrap: Boolean,
    },
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
        mergeProps({ style: boxStyle(theme.value, props, shrink) }, attrs),
        slots.default?.(),
      )
  },
})
