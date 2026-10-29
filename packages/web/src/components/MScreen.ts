import { defineComponent, h, mergeProps, provide } from 'vue'
import { layoutDirection, useMavisTheme } from '@mavis-ui/core/vue'
import { webAttrs } from '../style.js'

export const MScreen = defineComponent({
  name: 'MScreen',
  inheritAttrs: false,
  props: { scroll: Boolean },
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    provide(layoutDirection, 'column')
    return () =>
      h(
        'main',
        mergeProps(
          {
            class: 'm-screen',
            tabindex: -1,
            style: {
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: '100dvh',
              height: props.scroll ? '100dvh' : undefined,
              overflowY: props.scroll ? 'auto' : undefined,
              backgroundColor: theme.value.colors.background,
              color: theme.value.colors.text,
              colorScheme: theme.value.appearance,
              '--m-focus': theme.value.colors.primary,
            },
          },
          webAttrs(attrs),
        ),
        slots.default?.(),
      )
  },
})
