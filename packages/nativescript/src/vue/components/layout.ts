import {
  rowProps,
  columnProps,
  useMavisTheme,
  layoutDirection,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import { defineComponent, h, mergeProps, provide, registerElement } from 'nativescript-vue'
import { resolveSpace } from '@getcortexlabs/mavis-core'
import { boxProps, boxStyle } from '../props.js'
import { MavisFlexLayout } from '../../native/flex-layout.js'
import { useNativeViewAttrs } from '../accessibility.js'

export type { Align, Justify } from '@getcortexlabs/mavis-core/vue'

registerElement('MavisFlexLayout', () => MavisFlexLayout, {
  // NSVViewFlags.LAYOUT_VIEW is a const enum with no runtime export.
  viewFlags: 4,
})

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
      const shrink = useDefaultShrink()
      provide(layoutDirection, direction)
      return () =>
        h(
          'MavisFlexLayout',
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
  props: boxProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const shrink = useDefaultShrink()
    return () =>
      h(
        'GridLayout',
        mergeProps({ style: boxStyle(theme.value, props, shrink) }, nativeAttrs(), attrs),
        slots.default?.(),
      )
  },
})
