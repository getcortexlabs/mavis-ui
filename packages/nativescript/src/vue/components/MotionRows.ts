import { defineComponent, h, type PropType, type VNode } from 'nativescript-vue'
import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from '../use-motion-region.js'

export const MotionRows = defineComponent({
  props: { nodes: { type: Array as PropType<VNode[]>, required: true } },
  setup(props) {
    const region = useComponentLayout(() => props.nodes.map((node) => node.key))
    const hooks = useMotionRegion(() => region)
    return () =>
      h(
        'StackLayout',
        { ...hooks, verticalAlignment: 'top', horizontalAlignment: 'left' },
        props.nodes,
      )
  },
})
