import { defineComponent, h, mergeProps, ref } from 'vue'
import {
  createAnimatedText,
  createComposer,
  createSpeedDial,
  createScrollComponents,
  scrollFrameHostProps,
} from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from '../motion-region.js'
import { useScrollMotion } from '../scroll-motion.js'
import { MBox, MColumn, MRow } from './layout.js'
import { MCard } from './MCard.js'
import { MText } from './MText.js'
import { MInput } from './MInput.js'
import { MImage } from './MImage.js'
import { MButton } from './MButton.js'
import { MChip } from './MChip.js'
import { MPopover } from './MPopover.js'

const Frame = defineComponent({
  name: 'MScrollFrameHost',
  inheritAttrs: false,
  props: scrollFrameHostProps,
  setup(props, { attrs, slots }) {
    const motion = useMotionRegion(() => props.region)
    const scroll = ref<HTMLElement>()
    useScrollMotion(
      scroll,
      () => props.source,
      () => true,
    )
    return () =>
      h(
        'div',
        mergeProps(attrs, motion, {
          class: 'm-scroll-frame',
          style: {
            position: 'relative',
            height: `${props.height}px`,
            minWidth: 0,
            overflow: 'hidden',
            isolation: 'isolate',
          },
        }),
        [
          h(
            'div',
            {
              ref: scroll,
              role: 'region',
              'aria-label': props.label,
              tabindex: 0,
              class: 'm-scroll-frame-content',
              style: {
                height: '100%',
                overflowY: 'auto',
                overscrollBehaviorY: 'contain',
                display: 'flex',
                flexDirection: 'column',
              },
            },
            [h(MColumn, {}, { default: () => slots.default?.() })],
          ),
          slots.overlay?.(),
        ],
      )
  },
})
const ui = {
  Box: MBox,
  Card: MCard,
  Column: MColumn,
  Row: MRow,
  Text: MText,
  Input: MInput,
  Button: MButton,
  Chip: MChip,
  Image: MImage,
  Popover: MPopover,
  Frame,
}
export const MAnimatedText = createAnimatedText(MText)
export const MComposer = createComposer(ui, 'web')
export const MSpeedDial = createSpeedDial(ui)
export const { MCollapsibleHeader, MRefreshControl } = createScrollComponents(ui, 'web')
export { MPinInput } from './MPinInput.js'
