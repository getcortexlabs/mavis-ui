import { defineComponent, h, mergeProps, onBeforeUnmount, onMounted, ref } from 'vue'
import { skeletonProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MBox } from './layout.js'

export const MSkeleton = defineComponent({
  name: 'MSkeleton',
  inheritAttrs: false,
  props: skeletonProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const hidden = ref(false)
    function visibility() {
      hidden.value = document.hidden
    }
    onMounted(() => {
      visibility()
      document.addEventListener('visibilitychange', visibility)
    })
    onBeforeUnmount(() => document.removeEventListener('visibilitychange', visibility))
    return () =>
      h(
        MBox,
        mergeProps({ style: { alignSelf: 'flex-start' } }, attrs, {
          id: props.id,
          width: props.width,
          height: props.height,
          radius: props.radius,
          grow: props.grow,
          shrink: props.shrink,
          backgroundColor: theme.value.colors.border,
          class: 'm-skeleton',
          'data-animated': props.animated,
          style: { animationPlayState: hidden.value ? 'paused' : 'running', pointerEvents: 'none' },
          accessibilityHidden: true,
          tabindex: undefined,
          inert: true,
        }),
      )
  },
})
