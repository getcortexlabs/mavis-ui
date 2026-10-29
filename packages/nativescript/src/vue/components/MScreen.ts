import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { useMavisTheme } from '../theme.js'

export const MScreen = defineComponent({
  name: 'MScreen',
  inheritAttrs: false,
  props: { scroll: Boolean },
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    return () => {
      // Page and ScrollView require one content view; the column also accepts multiple slot children.
      const content = h(
        'FlexboxLayout',
        { flexDirection: 'column', alignItems: 'stretch' },
        slots.default?.(),
      )
      return h(
        'Page',
        mergeProps(
          {
            actionBarHidden: true,
            backgroundColor: theme.value.colors.background,
            statusBarStyle: theme.value.appearance === 'dark' ? 'light' : 'dark',
            androidStatusBarBackground: theme.value.colors.background,
          },
          attrs,
        ),
        [props.scroll ? h('ScrollView', {}, [content]) : content],
      )
    }
  },
})
