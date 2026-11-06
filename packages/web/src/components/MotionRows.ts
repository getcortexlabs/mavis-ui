import { defineComponent, h, type PropType, type VNode } from 'vue'
import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from '../motion-region.js'

/** Semantic rows stay in the table; only their private presentation is transformed. */
export const MotionRows = defineComponent({
  props: {
    nodes: { type: Array as PropType<VNode[]>, required: true },
    tag: { type: String, default: 'tbody' },
  },
  setup(props) {
    const region = useComponentLayout(() => props.nodes.map((node) => node.key))
    const hooks = useMotionRegion(() => region)
    return () => h(props.tag, hooks, props.nodes)
  },
})
