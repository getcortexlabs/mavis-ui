import { defineComponent, h, Transition } from 'vue'
import { MColumn } from './layout.js'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: { show: Boolean },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        Transition,
        { name: 'm-reveal' },
        {
          default: () => (props.show ? h(MColumn, { ...attrs, key: 'content' }, slots) : null),
        },
      )
  },
})
