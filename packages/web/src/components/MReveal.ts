import { defineComponent, h, mergeProps, onActivated, onDeactivated } from 'vue'
import {
  revealProps,
  useMavisTheme,
  useRevealState,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { revealHost } from '../reveal-motion.js'
import { MColumn } from './layout.js'
import { useMotionContext } from '../motion-context.js'
import { webAttrs, boxStyle } from '../style.js'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: revealProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const state = useRevealState(() => props.show)
    const context = useMotionContext()
    let mounted: HTMLElement | undefined
    let retained: HTMLElement | undefined
    function attach(element: HTMLElement) {
      if (mounted === element) return
      mounted = retained = element
      return state.attach(
        revealHost(
          element,
          context,
          () => theme.value,
          () => Boolean(props.accessibilityHidden),
        ),
      )
    }
    onDeactivated(() => {
      state.detach()
      mounted = undefined
    })
    onActivated(() => {
      if (retained) return attach(retained)
    })
    return () => {
      const { show, id, accessibilityLabel, accessibilityHidden, grow, shrink, width, ...content } =
        props
      return state.present.value
        ? h(
            'div',
            mergeProps(
              {
                class: 'm-reveal',
                style: {
                  ...boxStyle(theme.value, { grow, shrink: shrink ?? 0, width }),
                  overflow: state.phase.value === 'open' ? undefined : 'clip',
                },
              },
              webAttrs({ ...attrs, ...viewAttrs({ id, accessibilityLabel, accessibilityHidden }) }),
              {
                'data-state': state.phase.value,
                inert: !show || accessibilityHidden || undefined,
                'aria-hidden': !show || accessibilityHidden || undefined,
                onVnodeMounted: (node) => attach(node.el as HTMLElement),
                onVnodeBeforeUnmount: () => {
                  state.detach()
                  mounted = retained = undefined
                },
              },
            ),
            [h(MColumn, content, slots)],
          )
        : null
    }
  },
})
