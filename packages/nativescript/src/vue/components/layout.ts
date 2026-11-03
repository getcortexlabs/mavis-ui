import {
  rowProps,
  columnProps,
  useMavisTheme,
  layoutDirection,
  useLayoutShrink,
  motionBoxProps,
} from '@getcortexlabs/mavis-core/vue'
import { defineComponent, h, mergeProps, provide, registerElement } from 'nativescript-vue'
import { resolveSpace } from '@getcortexlabs/mavis-core'
import { boxStyle } from '../props.js'
import { MavisFlexLayout } from '../../native/flex-layout'
import { MavisBox } from '../../native/box'
import { useNativeViewAttrs } from '../accessibility.js'
import { useMotionRegion } from '../use-motion-region.js'
import { useMotionSurface } from '../use-motion-surface.js'

export type { Align, Justify } from '@getcortexlabs/mavis-core/vue'

registerElement('MavisFlexLayout', () => MavisFlexLayout, {
  // NSVViewFlags.LAYOUT_VIEW is a const enum with no runtime export.
  viewFlags: 4,
})
registerElement('MavisBox', () => MavisBox, { viewFlags: 4 })

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
      const nativeAttrs = useNativeViewAttrs(props)
      const shrink = useLayoutShrink()
      provide(layoutDirection, direction)
      return () =>
        h(
          'MavisFlexLayout',
          mergeProps(
            {
              style: {
                ...boxStyle(theme.value, props, shrink.value),
                flexDirection: direction,
                alignItems: alignment[props.align],
                justifyContent: distribution[props.justify],
                flexWrap: props.wrap ? 'wrap' : 'nowrap',
                gap: resolveSpace(theme.value, props.gap ?? 'none'),
              },
            },
            nativeAttrs(),
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
  props: motionBoxProps,
  setup(props, { attrs, slots }) {
    const region = useMotionRegion(() => props.motionRegion)
    const surface = useMotionSurface(() => props.motionSurface)
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const shrink = useLayoutShrink()
    return () =>
      h(
        'MavisBox',
        mergeProps(
          { style: boxStyle(theme.value, props, shrink.value) },
          nativeAttrs(),
          attrs,
          region,
          { onLoaded: surface.onLoaded, onUnloaded: surface.onUnloaded },
        ),
        slots.default?.(),
      )
  },
})
