import { defineComponent, h, mergeProps, Transition } from 'vue'
import { revealProps } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: revealProps,
  setup(props, { attrs, slots }) {
    let trigger: HTMLElement | undefined
    return () => {
      const { show, ...layout } = props
      return h(
        Transition,
        {
          name: 'm-reveal',
          onBeforeEnter: (element: Element) => {
            if (typeof HTMLElement === 'undefined' || !(element instanceof HTMLElement)) return
            if (!props.accessibilityHidden) {
              element.removeAttribute('inert')
              element.removeAttribute('aria-hidden')
            }
            trigger =
              document.activeElement instanceof HTMLElement ? document.activeElement : undefined
          },
          onBeforeLeave: (element: Element) => {
            if (typeof HTMLElement === 'undefined' || !(element instanceof HTMLElement)) return
            if (element.contains(document.activeElement) && trigger?.isConnected)
              trigger.focus({ preventScroll: true })
            // The leaving animation must not leave hidden controls in the tab order.
            element.setAttribute('inert', '')
            element.setAttribute('aria-hidden', 'true')
            trigger = undefined
          },
        },
        {
          default: () =>
            show ? h(MColumn, mergeProps(layout, attrs, { key: 'content' }), slots) : null,
        },
      )
    }
  },
})
