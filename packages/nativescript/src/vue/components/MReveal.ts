import { defineComponent, h } from 'nativescript-vue'
import { JoltTransition } from '@rafaelaugusto/jolt/vue'
import { MColumn } from './layout.js'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: { show: Boolean },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        JoltTransition,
        {
          enter: [{ opacity: [0, 1], y: [8, 0] }, { duration: 180 }],
          leave: [{ opacity: 0 }, { duration: 120 }],
        },
        {
          default: () => (props.show ? h(MColumn, { ...attrs, key: 'content' }, slots) : null),
        },
      )
  },
})
