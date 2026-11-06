import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import { ScrollHeaderSurface } from '@rafaelaugusto/jolt'
import {
  createAnimatedText,
  createComposer,
  createSpeedDial,
  createScrollComponents,
  scrollFrameHostProps,
} from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from '../use-motion-region.js'
import { useScrollMotion } from '../use-scroll-motion.js'
import { MBox, MColumn, MRow } from './layout.js'
import { MCard } from './MCard.js'
import { MText } from './MText.js'
import { MInput } from './MInput.js'
import { MImage } from './MImage.js'
import { MButton } from './MButton.js'
import { MChip } from './MChip.js'
import { MPopover } from './MPopover.js'

registerElement('MavisRefreshFrame', () => ScrollHeaderSurface, { viewFlags: 4 })
const Frame = defineComponent({
  name: 'MScrollFrameHost',
  inheritAttrs: false,
  props: scrollFrameHostProps,
  setup(props, { attrs, slots }) {
    const motion = useMotionRegion(() => props.region)
    const scroll = useScrollMotion(() => props.source)
    return () =>
      h(
        'MavisRefreshFrame',
        mergeProps(attrs, motion, { height: props.height, clipToBounds: true }),
        [
          h(
            'ScrollView',
            { ...scroll, accessibilityLabel: props.label, iosOverflowSafeArea: false },
            [h('StackLayout', { paddingTop: 0 }, slots.default?.())],
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
export const MComposer = createComposer(ui, 'native')
export const MSpeedDial = createSpeedDial(ui)
export const { MCollapsibleHeader, MRefreshControl } = createScrollComponents(ui, 'native')
export { MPinInput } from './MPinInput.js'
