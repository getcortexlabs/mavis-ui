import { useScrollMotion } from '../use-scroll-motion.js'
import { useAppToastHost } from '@getcortexlabs/mavis-core/vue'
import { MToast } from './MToast.js'
import {
  defineComponent,
  cloneVNode,
  Fragment,
  h,
  mergeProps,
  onBeforeUnmount,
  provide,
  registerElement,
  watch,
  type VNode,
} from 'nativescript-vue'
import { isIOS, type EventData, type View } from '@nativescript/core'
import { screenProps, useMavisTheme, layoutDirection } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { MavisScreenScroll } from '../../native/screen-scroll'
import { MavisScreen } from '../../native/screen'
import { dismissKeyboardOn } from '../../native/keyboard-dismiss'
import { useNativeViewAttrs } from '../accessibility.js'
import { provideLayerHost } from '../layers.js'
import { expandLayerHost } from '../../native/sheet'
import { useMotionRegion } from '../use-motion-region.js'

registerElement('MavisScreenScroll', () => MavisScreenScroll, {
  // NSVViewFlags.CONTENT_VIEW; ScrollView owns one content view.
  viewFlags: 2,
})
// NSVViewFlags.LAYOUT_VIEW; the page container also puts the keyboard away.
registerElement('MavisScreen', () => MavisScreen, { viewFlags: 4 })

// Overlay children must remain siblings of the ScrollView for retained headers.
function coverOverlay(node: VNode): VNode {
  if (node.type !== Fragment) return cloneVNode(node, { accessibilityHidden: true })
  const copy = cloneVNode(node)
  if (Array.isArray(copy.children))
    copy.children = copy.children.map((child) =>
      child && typeof child === 'object' && 'type' in child ? coverOverlay(child as VNode) : child,
    )
  return copy
}

export const MScreen = defineComponent({
  name: 'MScreen',
  inheritAttrs: false,
  props: screenProps,
  setup(props, { attrs, slots }) {
    const region = useMotionRegion(() => props.motionRegion)
    const scrollMotion = useScrollMotion(() => props.motionScroll)
    const { theme } = useMavisTheme()
    const appToast = useAppToastHost()
    const nativeAttrs = useNativeViewAttrs(props)
    const layers = provideLayerHost()
    provide(layoutDirection, 'column')
    let container: View | undefined
    let release: (() => void) | undefined
    const applyKeyboard = () => {
      release?.()
      release = undefined
      if (!container || !props.dismissKeyboard) return
      release = dismissKeyboardOn(container, { tap: true, drag: props.scroll })
    }
    watch(() => [props.dismissKeyboard, props.scroll], applyKeyboard)
    onBeforeUnmount(() => {
      release?.()
      release = undefined
    })
    return () => {
      // A presented layer covers the content, which leaves the accessibility tree meanwhile.
      const presented = layers.filter((layer) => layer.presented.value)
      const modal = presented.filter((layer) => layer.modal !== false)
      const notices = presented.filter((layer) => layer.modal === false)
      const covered = modal.length > 0
      // Page and ScrollView require one content view; the column also accepts multiple slot children.
      const content = h(
        MColumn,
        { accessibilityHidden: props.scroll ? undefined : covered },
        {
          default: () => [
            slots.default?.(),
            appToast?.requested.value
              ? h(MToast, { controller: appToast.controller, closeLabel: appToast.closeLabel })
              : null,
          ],
        },
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
          h(
            'MavisScreen',
            mergeProps(region, {
              ...(isIOS ? { clipToBounds: false } : {}),
              onLoaded: (event: EventData) => {
                container = event.object as View
                applyKeyboard()
              },
              onUnloaded: () => {
                release?.()
                release = undefined
                container = undefined
              },
            }),
            [
              props.scroll
                ? h(
                    'MavisScreenScroll',
                    { iosOverflowSafeArea: false, accessibilityHidden: covered, ...scrollMotion },
                    [content],
                  )
                : content,
              covered ? slots.overlay?.().map(coverOverlay) : slots.overlay?.(),
              ...notices.map((layer) =>
                h(layer.component, { ...layer.props, covered, key: layer.key }),
              ),
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
                    modal.map((layer) => h(layer.component, { ...layer.props, key: layer.key })),
                  )
                : null,
            ],
          ),
        ],
      )
    }
  },
})
