import { defineComponent, h, mergeProps, provide, registerElement } from 'nativescript-vue'
import { screenProps, useMavisTheme, layoutDirection, viewAttrs } from '@mavis-ui/core/vue'
import { MColumn } from './layout.js'
import { MavisScreenScroll } from '../../native/screen-scroll.js'

registerElement('MavisScreenScroll', () => MavisScreenScroll, {
  // NSVViewFlags.CONTENT_VIEW; ScrollView owns one content view.
  viewFlags: 2,
})

export const MScreen = defineComponent({
  name: 'MScreen',
  inheritAttrs: false,
  props: screenProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    provide(layoutDirection, 'column')
    return () => {
      // Page and ScrollView require one content view; the column also accepts multiple slot children.
      const content = h(MColumn, {}, { default: () => slots.default?.() })
      return h(
        'Page',
        mergeProps(
          {
            actionBarHidden: true,
            backgroundColor: theme.value.colors.background,
            statusBarStyle: theme.value.appearance === 'dark' ? 'light' : 'dark',
            androidStatusBarBackground: theme.value.colors.background,
          },
          viewAttrs(props),
          attrs,
        ),
        [
          props.scroll
            ? h('MavisScreenScroll', { iosOverflowSafeArea: false }, [content])
            : content,
        ],
      )
    }
  },
})
