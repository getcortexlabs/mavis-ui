import { fontFamily } from '@getcortexlabs/mavis-core'
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
    // Browsers already move focus away on a tap outside the editor; a drag keeps the keyboard.
    const releaseKeyboard = (event: TouchEvent) => {
      if (!props.dismissKeyboard || !props.scroll) return
      const screen = element.value
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !screen || active === screen) return
      if (!screen.contains(active) || active.contains(event.target as Node)) return
      const editor =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active.isContentEditable
      if (editor) active.blur()
    }
    return () =>
      h(
        'main',
        mergeProps(
          {
            ref: element,
            class: 'm-screen',
            tabindex: props.scroll ? 0 : -1,
            onTouchmovePassive: releaseKeyboard,
            style: {
              fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
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
