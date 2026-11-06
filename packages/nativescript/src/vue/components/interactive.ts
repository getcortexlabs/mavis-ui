import { defineComponent, h, type PropType } from 'nativescript-vue'
import {
  createNumberFlow,
  createSortableList,
  createSwipeActions,
  sortableScrollProps,
} from '@getcortexlabs/mavis-core/vue'
import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { numberFlowFormatter } from '../../native/number-flow-format'
import { useScrollMotion } from '../use-scroll-motion.js'
import { useMotionSurface } from '../use-motion-surface.js'
import { MBox, MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MMenu } from './navigation.js'

const SortableScroll = defineComponent({
  name: 'MSortableScroll',
  props: sortableScrollProps,
  setup(props, { slots }) {
    const motion = useScrollMotion(() => props.source)
    return () => h('ScrollView', { ...motion, height: props.height }, slots.default?.())
  },
})
const SortableBody = defineComponent({
  name: 'MSortableBody',
  props: { motionSurface: Object as PropType<MotionSurface> },
  setup(props, { slots }) {
    const motion = useMotionSurface(() => props.motionSurface)
    return () => h('StackLayout', { ...motion, padding: 6 }, slots.default?.())
  },
})
const ui = { Box: MBox, Column: MColumn, Row: MRow, Text: MText, Button: MButton, Menu: MMenu }
export const MNumberFlow = createNumberFlow(MText, 'native', numberFlowFormatter)
export const MSortableList = createSortableList(
  { ...ui, Scroll: SortableScroll, ListBody: SortableBody },
  'native',
)
export const MSwipeActions = createSwipeActions(ui, 'native')
export { MResizablePanels } from './MResizablePanels.js'
export { MImageCompare } from './MImageCompare.js'

export { MImageViewer } from './MImageViewer.js'
