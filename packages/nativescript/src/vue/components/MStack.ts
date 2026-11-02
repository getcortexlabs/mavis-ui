import { computed, defineComponent, h, mergeProps, provide, shallowRef } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { resolveSpace, stackLayout } from '@getcortexlabs/mavis-core'
import {
  stackProps,
  layoutDirection,
  useLayoutShrink,
  useMavisTheme,
} from '@getcortexlabs/mavis-core/vue'
import { boxStyle } from '../props.js'
import { useNativeViewAttrs } from '../accessibility.js'
import './layout.js'

const align = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  stretch: 'stretch',
} as const
const justify = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
} as const

export const MStack = defineComponent({
  name: 'MStack',
  inheritAttrs: false,
  props: stackProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const shrink = useLayoutShrink()
    const width = shallowRef<number>()
    const layout = computed(() =>
      stackLayout(
        {
          direction: props.direction,
          gap: props.gap,
          align: props.align,
          justify: props.justify,
          wrap: props.wrap,
        },
        props.responsive,
        width.value,
      ),
    )
    const direction = computed(() => layout.value.direction ?? props.direction)
    provide(layoutDirection, direction)
    const measure = (event: EventData) => {
      const view = event.object as View
      const size = view.getActualSize().width
      // The inner layout occupies the outer Box's content area, after padding.
      if (size > 0 && size !== width.value) width.value = size
    }
    return () =>
      h(
        'MavisBox',
        mergeProps({ style: boxStyle(theme.value, props, shrink.value) }, nativeAttrs(), attrs),
        [
          h(
            'MavisFlexLayout',
            {
              onLayoutChanged: measure,
              onUnloaded: () => {
                width.value = undefined
              },
              style: {
                flexDirection: direction.value,
                alignItems: align[layout.value.align ?? props.align],
                justifyContent: justify[layout.value.justify ?? props.justify],
                flexWrap: layout.value.wrap ? 'wrap' : 'nowrap',
                gap: resolveSpace(theme.value, layout.value.gap ?? 'none'),
              },
            },
            slots.default?.(),
          ),
        ],
      )
  },
})
