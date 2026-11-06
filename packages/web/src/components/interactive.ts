import { defineComponent, h, ref } from 'vue'
import {
  createNumberFlow,
  createSortableList,
  createSwipeActions,
  sortableScrollProps,
} from '@getcortexlabs/mavis-core/vue'
import { useScrollMotion } from '../scroll-motion.js'
import { MBox, MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MMenu } from './navigation.js'

const SortableScroll = defineComponent({
  name: 'MSortableScroll',
  props: sortableScrollProps,
  setup(props, { slots }) {
    const element = ref<HTMLElement>()
    useScrollMotion(
      element,
      () => props.source,
      () => true,
    )
    return () =>
      h(
        'div',
        {
          ref: element,
          style: { height: `${props.height}px`, overflowY: 'auto', overscrollBehavior: 'contain' },
        },
        slots.default?.(),
      )
  },
})
const ui = { Box: MBox, Column: MColumn, Row: MRow, Text: MText, Button: MButton, Menu: MMenu }
export const MNumberFlow = createNumberFlow(MText, 'web')
export const MSortableList = createSortableList(
  {
    ...ui,
    Scroll: SortableScroll,
    ListBody: MBox,
    input: (fresh) => ({
      onPointerdownCapture: (event: PointerEvent) => {
        if (
          event.isPrimary &&
          event.button === 0 &&
          event.target instanceof Element &&
          !event.target.closest('[data-sort-handle]')
        )
          fresh()
      },
    }),
  },
  'web',
)
export const MSwipeActions = createSwipeActions(ui, 'web')
export { MResizablePanels } from './MResizablePanels.js'
export { MImageCompare } from './MImageCompare.js'

export { MImageViewer } from './MImageViewer.js'
