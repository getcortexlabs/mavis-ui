import { defineComponent, h, mergeProps, provide, registerElement } from 'nativescript-vue'
import { isIOS, type EventData, type View } from '@nativescript/core'
import { screenProps, useMavisTheme, layoutDirection } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { MavisScreenScroll } from '../../native/screen-scroll'
import { useNativeViewAttrs } from '../accessibility.js'
import { provideLayerHost } from '../layers.js'
import { expandLayerHost } from '../../native/sheet'

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
    const nativeAttrs = useNativeViewAttrs(props)
    const layers = provideLayerHost()
    provide(layoutDirection, 'column')
    return () => {
      // A presented layer covers the content, which leaves the accessibility tree meanwhile.
      const presented = layers.filter((layer) => layer.presented.value)
      const covered = presented.length > 0
      // Page and ScrollView require one content view; the column also accepts multiple slot children.
      const content = h(
        MColumn,
        { accessibilityHidden: props.scroll ? undefined : covered },
        { default: () => slots.default?.() },
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
          nativeAttrs(),
          attrs,
        ),
        [
          h('GridLayout', isIOS ? { clipToBounds: false } : {}, [
            props.scroll
              ? h(
                  'MavisScreenScroll',
                  { iosOverflowSafeArea: false, accessibilityHidden: covered },
                  [content],
                )
              : content,
            // Layers such as sheets render above the content. Their host ignores Core's safe-area
            // adjustment and grows over the whole window, so the sheet geometry can trust its frame
            // and the scrim covers the status bar and home indicator areas too.
            covered
              ? h(
                  'GridLayout',
                  {
                    iosIgnoreSafeArea: true,
                    onLoaded: (event: EventData) => expandLayerHost(event.object as View),
                    onLayoutChanged: (event: EventData) => expandLayerHost(event.object as View),
                  },
                  presented.map((layer) => h(layer.component, { ...layer.props, key: layer.key })),
                )
              : null,
          ]),
        ],
      )
    }
  },
})
