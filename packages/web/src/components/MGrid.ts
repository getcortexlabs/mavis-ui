import { useMotionRegion } from '../motion-region.js'
import { defineComponent, h, mergeProps, provide, shallowRef } from 'vue'
import { gridColumns, resolveSpace } from '@getcortexlabs/mavis-core'
import {
  gridProps,
  layoutDirection,
  useLayoutShrink,
  useMavisTheme,
  useComponentLayout,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { boxStyle, webAttrs } from '../style.js'
import { useContentWidth } from '../content-width.js'

export const MGrid = defineComponent({
  name: 'MGrid',
  inheritAttrs: false,
  props: gridProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const shrink = useLayoutShrink()
    provide(layoutDirection, 'column')
    const element = shallowRef<HTMLElement>()
    const width = useContentWidth(element, () => props.minColumnWidth !== undefined)
    const automatic = useComponentLayout(
      () =>
        gridColumns(
          props.columns,
          props.minColumnWidth,
          resolveSpace(theme.value, props.gap ?? 'none'),
          width.value,
        ),
      false,
    )
    const motion = useMotionRegion(() => props.motionRegion ?? automatic)
    return () => {
      const gap = resolveSpace(theme.value, props.gap ?? 'none')
      const columns = gridColumns(props.columns, props.minColumnWidth, gap, width.value)
      return h(
        'div',
        mergeProps(
          {
            ...motion,
            ref: element,
            class: 'm-grid',
            style: {
              ...boxStyle(theme.value, props, shrink.value),
              display: 'grid',
              gap: `${gap}px`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
        ),
        slots.default?.(),
      )
    }
  },
})
