import {
  rowProps,
  columnProps,
  viewAttrs,
  useMavisTheme,
  layoutDirection,
  useLayoutShrink,
  motionBoxProps,
} from '@getcortexlabs/mavis-core/vue'
import { defineComponent, h, mergeProps, provide } from 'vue'
import { resolveSpace } from '@getcortexlabs/mavis-core'
import { boxStyle, webAttrs } from '../style.js'
import { useMotionRegion } from '../motion-region.js'
import { useMotionSurface } from '../use-motion-surface.js'

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

export function createLayout(name: string, direction: 'row' | 'column', tag = 'div') {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: direction === 'row' ? rowProps : columnProps,
    setup(props, { attrs, slots }) {
      const region = useMotionRegion(() => props.motionRegion)
      const { theme } = useMavisTheme()
      const shrink = useLayoutShrink()
      provide(layoutDirection, direction)
      return () =>
        h(
          tag,
          mergeProps(
            {
              style: {
                ...boxStyle(theme.value, props, shrink.value),
                display: 'flex',
                flexDirection: direction,
                alignItems: `var(--m-layout-align, ${alignment[props.align]})`,
                justifyContent: `var(--m-layout-justify, ${distribution[props.justify]})`,
                flexWrap: props.wrap ? 'wrap' : 'nowrap',
                gap: `var(--m-layout-gap, ${resolveSpace(theme.value, props.gap ?? 'none')}px)`,
              },
            },
            webAttrs({ ...attrs, ...viewAttrs(props) }),
            region,
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
    const surface = useMotionSurface(() => props.motionSurface)
    const { theme } = useMavisTheme()
    const shrink = useLayoutShrink()
    return () =>
      h(
        'div',
        mergeProps(
          {
            class: 'm-box',
            style: { ...boxStyle(theme.value, props, shrink.value), display: 'grid' },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
          region,
          surface,
        ),
        slots.default?.(),
      )
  },
})
