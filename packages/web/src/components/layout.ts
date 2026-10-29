import { defineComponent, h, mergeProps, provide, type PropType } from 'vue'
import { resolveSpace } from '@mavis-ui/core'
import {
  boxProps,
  spacingProp,
  useMavisTheme,
  layoutDirection,
  useDefaultShrink,
} from '@mavis-ui/core/vue'
import { boxStyle, webAttrs } from '../style.js'

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
          'div',
          mergeProps(
            {
              style: {
                ...boxStyle(theme.value, props, shrink),
                display: 'flex',
                flexDirection: direction,
                alignItems: alignment[props.align],
                justifyContent: distribution[props.justify],
                flexWrap: props.wrap ? 'wrap' : 'nowrap',
                gap: `${resolveSpace(theme.value, props.gap ?? 'none')}px`,
              },
            },
            webAttrs(attrs),
          ),
          slots.default?.(),
        )
    },
  })
}

export const MRow = createLayout('MRow', 'row')
export const MColumn = createLayout('MColumn', 'column')
export const MBox = defineComponent({
  name: 'MBox',
  inheritAttrs: false,
  props: boxProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    return () =>
      h(
        'div',
        mergeProps(
          {
            class: 'm-box',
            style: { ...boxStyle(theme.value, props, shrink), display: 'grid' },
          },
          webAttrs(attrs),
        ),
        slots.default?.(),
      )
  },
})
