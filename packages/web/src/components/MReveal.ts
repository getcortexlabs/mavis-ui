import { defineComponent, h, mergeProps, Transition, shallowRef } from 'vue'
import { revealProps } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { revealMotion } from '@getcortexlabs/mavis-core'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: revealProps,
  setup(props, { attrs, slots }) {
    const target = shallowRef<HTMLElement | null>(null)
    const motion = useWebMotion(target, {
      initial: { opacity: revealMotion.enter[0].opacity[0], y: revealMotion.enter[0].y[0] },
      enter: { keyframes: { opacity: 1, y: 0 }, transition: revealMotion.enter[1] },
      leave: { keyframes: revealMotion.leave[0], transition: revealMotion.leave[1] },
    })
    let trigger: HTMLElement | undefined
    return () => {
      const { show, ...layout } = props
      return h(
        Transition,
        {
          ...motion.transition,
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
            show
              ? h(
                  MColumn,
                  mergeProps(layout, attrs, {
                    key: 'content',
                    onVnodeMounted: (node) => {
                      target.value = node.el as HTMLElement
                    },
                    onVnodeUnmounted: () => {
                      target.value = null
                    },
                  }),
                  slots,
                )
              : null,
        },
      )
    }
  },
})
