import {
  computed,
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
} from 'vue'
import { resolveSpace, stackLayout } from '@getcortexlabs/mavis-core'
import {
  stackProps,
  layoutDirection,
  useLayoutShrink,
  useMavisTheme,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { boxStyle, webAttrs } from '../style.js'

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
    const shrink = useLayoutShrink()
    const element = shallowRef<HTMLElement>()
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
    let observer: ResizeObserver | undefined
    onMounted(() => {
      if (!element.value || typeof ResizeObserver === 'undefined') return
      observer = new ResizeObserver(([entry]) => {
        if (entry) width.value = entry.contentRect.width
      })
      observer.observe(element.value)
    })
    onBeforeUnmount(() => observer?.disconnect())
    return () =>
      h(
        'div',
        mergeProps(
          {
            ref: element,
            class: 'm-stack',
            style: {
              ...boxStyle(theme.value, props, shrink.value),
              display: 'flex',
              flexDirection: direction.value,
              alignItems: align[layout.value.align ?? props.align],
              justifyContent: justify[layout.value.justify ?? props.justify],
              flexWrap: layout.value.wrap ? 'wrap' : 'nowrap',
              gap: `${resolveSpace(theme.value, layout.value.gap ?? 'none')}px`,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
        ),
        slots.default?.(),
      )
  },
})
