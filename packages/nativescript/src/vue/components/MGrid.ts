import { useMotionRegion } from '../use-motion-region.js'
import {
  Comment,
  Fragment,
  Text,
  createVNode,
  defineComponent,
  h,
  mergeProps,
  provide,
  shallowRef,
  type VNode,
} from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { gridColumns, resolveSpace } from '@getcortexlabs/mavis-core'
import {
  gridProps,
  layoutDirection,
  useLayoutShrink,
  useMavisTheme,
  useComponentLayout,
} from '@getcortexlabs/mavis-core/vue'
import { boxStyle } from '../props.js'
import { useNativeViewAttrs } from '../accessibility.js'
import './layout.js'

export const MGrid = defineComponent({
  name: 'MGrid',
  inheritAttrs: false,
  props: gridProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const shrink = useLayoutShrink()
    const nativeAttrs = useNativeViewAttrs(props)
    provide(layoutDirection, 'column')
    const width = shallowRef<number>()
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
      const count = gridColumns(props.columns, props.minColumnWidth, gap, width.value)
      let index = 0
      // Keep fragment boundaries so independently keyed slot groups retain their identity.
      const place = (nodes: VNode[]): VNode[] =>
        nodes.flatMap((child) => {
          if (child.type === Fragment)
            return [
              createVNode(
                Fragment,
                { key: child.key ?? undefined },
                place(child.children as VNode[]),
              ),
            ]
          if (child.type === Comment || (child.type === Text && !String(child.children).trim()))
            return []
          const cell = index++
          return [
            h(
              'MavisBox',
              {
                key: child.key ?? cell,
                col: (cell % count) * 2,
                row: Math.floor(cell / count) * 2,
              },
              [child],
            ),
          ]
        })
      const children = place(slots.default?.() ?? [])
      const rows = Math.ceil(index / count)
      return h(
        'MavisBox',
        mergeProps({ style: boxStyle(theme.value, props, shrink.value) }, nativeAttrs(), attrs),
        [
          h(
            'GridLayout',
            {
              ...motion,
              columns: Array.from({ length: count }, () => '*').join(`,${gap},`),
              rows: Array.from({ length: rows }, () => 'auto').join(`,${gap},`),
              onLayoutChanged: (event: EventData) => {
                width.value = (event.object as View).getActualSize().width
              },
            },
            children,
          ),
        ],
      )
    }
  },
})
