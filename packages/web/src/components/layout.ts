import {
  rowProps,
  columnProps,
  viewAttrs,
  useMavisTheme,
  layoutDirection,
  useDefaultShrink,
  motionBoxProps,
} from '@getcortexlabs/mavis-core/vue'
import { defineComponent, h, mergeProps, provide } from 'vue'
import { resolveSpace } from '@getcortexlabs/mavis-core'
import { boxStyle, webAttrs } from '../style.js'
import { useMotionRegion } from '../motion-region.js'

export type { Align, Justify } from '@getcortexlabs/mavis-core/vue'

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
  props: motionBoxProps,
  setup(props, { attrs, slots }) {
    const region = useMotionRegion(() => props.motionRegion)
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
          region,
        ),
        slots.default?.(),
      )
  },
})
