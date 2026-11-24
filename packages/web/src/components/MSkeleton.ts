import { defineComponent, h, mergeProps, onMounted, ref, watch } from 'vue'
import { skeletonProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MBox } from './layout.js'
import { LoadingDecoration } from './LoadingDecoration.js'

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
      watch(
        () => props.effect === 'pulse' && props.animated,
        (pulse, _, onCleanup) => {
          if (!pulse) return
          visibility()
          document.addEventListener('visibilitychange', visibility)
          onCleanup(() => document.removeEventListener('visibilitychange', visibility))
        },
        { immediate: true },
      )
    })
    return () =>
      h(
        props.effect === 'shimmer' ? LoadingDecoration : MBox,
        mergeProps(
          {
            style: {
              alignSelf:
                props.width === undefined || props.width === 'auto' ? 'stretch' : 'flex-start',
            },
          },
          attrs,
          {
            id: props.id,
            width: props.width,
            height: props.height,
            radius: props.radius,
            grow: props.grow,
            shrink: props.shrink,
            backgroundColor: theme.value.colors.border,
            class: 'm-skeleton',
            'data-animated': props.effect === 'pulse' && props.animated,
            ...(props.effect === 'shimmer' ? { kind: 'shimmer', animated: props.animated } : {}),
            style: {
              animationPlayState: hidden.value ? 'paused' : 'running',
              pointerEvents: 'none',
            },
            accessibilityHidden: true,
            tabindex: undefined,
            inert: true,
          },
        ),
      )
  },
})
