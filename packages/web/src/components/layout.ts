import {
  rowProps,
  columnProps,
  viewAttrs,
  useMavisTheme,
  layoutDirection,
  useDefaultShrink,
  boxProps,
} from '@mavis-ui/core/vue'
import { defineComponent, h, mergeProps, provide } from 'vue'
import { resolveSpace } from '@mavis-ui/core'
import { boxStyle, webAttrs } from '../style.js'

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
            webAttrs({ ...attrs, ...viewAttrs(props) }),
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
          webAttrs({ ...attrs, ...viewAttrs(props) }),
        ),
        slots.default?.(),
      )
  },
})
