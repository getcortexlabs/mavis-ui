import { defineComponent, h, mergeProps, provide } from 'vue'
import {
  screenProps,
  useMavisTheme,
  layoutDirection,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { webAttrs } from '../style.js'
import { useScreenViewport } from '../screen-viewport.js'

export const MScreen = defineComponent({
  name: 'MScreen',
  inheritAttrs: false,
  props: screenProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const element = useScreenViewport(() => props.scroll)
    provide(layoutDirection, 'column')
    return () =>
      h(
        'main',
        mergeProps(
          {
            ref: element,
            class: 'm-screen',
            tabindex: props.scroll ? 0 : -1,
            style: {
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: props.scroll ? 'var(--m-viewport-height, 100dvh)' : '100dvh',
              height: props.scroll ? 'var(--m-viewport-height, 100dvh)' : undefined,
              overflowY: props.scroll ? 'auto' : undefined,
              backgroundColor: theme.value.colors.background,
              color: theme.value.colors.text,
              '--m-focus': theme.value.colors.primary,
              colorScheme: theme.value.appearance,
            },
          },
          webAttrs({ ...attrs, ...viewAttrs(props) }),
        ),
        slots.default?.(),
      )
  },
})
