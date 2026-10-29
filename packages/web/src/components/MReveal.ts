import { defineComponent, h, mergeProps, Transition } from 'vue'
import { revealProps } from '@mavis-ui/core/vue'
import { MColumn } from './layout.js'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: revealProps,
  setup(props, { attrs, slots }) {
    return () => {
      const { show, ...layout } = props
      return h(
        Transition,
        { name: 'm-reveal' },
        {
          default: () =>
            show ? h(MColumn, mergeProps(layout, attrs, { key: 'content' }), slots) : null,
        },
      )
    }
  },
})
