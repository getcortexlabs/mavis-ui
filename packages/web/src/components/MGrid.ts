import { defineComponent, h, mergeProps, provide, shallowRef } from 'vue'
import { gridColumns, resolveSpace } from '@getcortexlabs/mavis-core'
import {
  gridProps,
  layoutDirection,
  useLayoutShrink,
  useMavisTheme,
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
    return () => {
      const gap = resolveSpace(theme.value, props.gap ?? 'none')
      const columns = gridColumns(props.columns, props.minColumnWidth, gap, width.value)
      return h(
        'div',
        mergeProps(
          {
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
