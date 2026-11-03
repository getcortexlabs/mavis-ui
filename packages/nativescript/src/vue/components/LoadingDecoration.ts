import { defineComponent, h, mergeProps, type PropType } from 'nativescript-vue'
import { skeletonProps, useLoadingDecoration } from '@getcortexlabs/mavis-core/vue'
import { MBox } from './layout.js'

export const LoadingDecoration = defineComponent({
  name: 'MavisLoadingDecoration',
  inheritAttrs: false,
  props: {
    ...skeletonProps,
    kind: { type: String as PropType<'shimmer' | 'dots' | 'bars' | 'ring'>, required: true },
    color: { type: String, default: undefined },
    size: { type: Number, default: 24 },
  },
  setup(props, { attrs }) {
    const surface = useLoadingDecoration(() => ({
      kind: props.kind,
      animated: props.animated,
      size: props.size,
      color: props.color,
    }))
    return () =>
      h(
        MBox,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          height: props.height,
          radius: props.radius,
          grow: props.grow,
          shrink: props.shrink,
          motionSurface: surface,
          accessibilityHidden: true,
          accessible: false,
          isUserInteractionEnabled: false,
        }),
      )
  },
})
