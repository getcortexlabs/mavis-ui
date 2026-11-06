import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  watch,
  type PropType,
} from 'nativescript-vue'
import {
  Application,
  ScrollView,
  isAndroid,
  isIOS,
  type View,
  type EventData,
} from '@nativescript/core'
import { reducedMotion, onReducedMotion } from '@rafaelaugusto/jolt'
import {
  createColorPicker,
  createGauge,
  createSwipeDeck,
  createTransferList,
  createTour,
  createMarquee,
  tourHostProps,
  marqueeHostProps,
} from '@getcortexlabs/mavis-core/vue'
import type { gaugeGeometry } from '@getcortexlabs/mavis-core'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'
import { MBox, MColumn, MRow } from './layout.js'
import { MStack } from './MStack.js'
import { MCard } from './MCard.js'
import { MText } from './MText.js'
import { MInput } from './MInput.js'
import { MImage } from './MImage.js'
import { MButton } from './MButton.js'
import { MSlider } from './MSlider.js'
import { MCheckbox } from './MCheckbox.js'
import { MNumberFlow } from './interactive.js'
import { MPopover } from './MPopover.js'

const GaugeFallback = defineComponent({
  props: {
    geometry: Object as PropType<ReturnType<typeof gaugeGeometry>>,
    size: Number,
    strokeWidth: Number,
    color: String,
    track: String,
    hidden: Boolean,
  },
  setup() {
    return () => h('GridLayout', { accessible: false, isUserInteractionEnabled: false })
  },
})
interface FocusView {
  readonly isFirstResponder: boolean
  readonly subviews: { count: number; objectAtIndex(index: number): FocusView }
  readonly window?: FocusView
  becomeFirstResponder(): boolean
}
const TourHost = defineComponent({
  inheritAttrs: false,
  props: tourHostProps,
  setup(props, { attrs, slots }) {
    let root: View | undefined,
      restore = () => {}
    function capture() {
      if (!root?.isLoaded) return
      if (isAndroid) {
        const focused = root.page?.android?.findFocus?.()
        restore = () => focused?.requestFocus?.()
      } else if (isIOS) {
        const find = (view: FocusView): FocusView | undefined => {
          if (view.isFirstResponder) return view
          for (let i = 0; i < view.subviews.count; i++) {
            const result = find(view.subviews.objectAtIndex(i))
            if (result) return result
          }
        }
        const window = (root.ios as FocusView)?.window
        const focused = window ? find(window) : undefined
        restore = () => {
          if (focused?.window) focused.becomeFirstResponder()
        }
      }
    }
    watch(
      () => props.active,
      (active) => {
        if (active) capture()
        else
          void nextTick(() => {
            if (root?.isLoaded && !props.active && props.restoreFocus) restore()
            restore = () => {}
          })
      },
    )
    return () =>
      h(
        'StackLayout',
        mergeProps(attrs, {
          onLoaded: (event: EventData) => {
            root = event.object as View
            if (props.active) capture()
          },
          onUnloaded: () => {
            root = undefined
            restore = () => {}
          },
        }),
        slots.default?.(),
      )
  },
})
const TargetHost = defineComponent({
  inheritAttrs: false,
  props: tourHostProps,
  setup(props, { attrs, slots }) {
    let root: View | undefined
    function reveal() {
      if (!props.active || !root?.isLoaded) return
      for (
        let parent = root.parent as View | undefined;
        parent;
        parent = parent.parent as View | undefined
      ) {
        if (parent instanceof ScrollView) {
          const location = root.getLocationRelativeTo(parent)
          if (location) {
            const size = root.getActualSize(),
              viewport = parent.getActualSize()
            if (location.y < 0)
              parent.scrollToVerticalOffset(Math.max(0, parent.verticalOffset + location.y), false)
            else if (location.y + size.height > viewport.height)
              parent.scrollToVerticalOffset(
                Math.max(0, parent.verticalOffset + location.y + size.height - viewport.height),
                false,
              )
          }
          break
        }
      }
      notifyAccessibilityLayout(root)
    }
    watch(
      () => props.active,
      () => void nextTick(reveal),
      { flush: 'post' },
    )
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          onLoaded: (event: EventData) => {
            root = event.object as View
            void nextTick(reveal)
          },
          onUnloaded: () => {
            root = undefined
          },
        }),
        slots.default?.(),
      )
  },
})
const MarqueeHost = defineComponent({
  inheritAttrs: false,
  props: marqueeHostProps,
  emits: ['environment'],
  setup(_props, { attrs, slots, emit }) {
    let root: View | undefined,
      suspended = false,
      attached = false,
      release = () => {}
    const update = () =>
      emit('environment', {
        reduced: reducedMotion(),
        paused: !attached || suspended,
        width: root?.getActualSize().width ?? 0,
      })
    const suspend = () => {
        suspended = true
        update()
      },
      resume = () => {
        suspended = false
        update()
      }
    function detach() {
      attached = false
      release()
      Application.off(Application.suspendEvent, suspend)
      Application.off(Application.resumeEvent, resume)
      update()
    }
    onBeforeUnmount(detach)
    onDeactivated(detach)
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          clipToBounds: true,
          width: '100%',
          onLoaded: (event: EventData) => {
            root = event.object as View
            if (attached) return
            attached = true
            release = onReducedMotion(update)
            Application.on(Application.suspendEvent, suspend)
            Application.on(Application.resumeEvent, resume)
            update()
          },
          onUnloaded: detach,
          onLayoutChanged: update,
        }),
        slots.default?.(),
      )
  },
})
const ui = {
  Box: MBox,
  Column: MColumn,
  Row: MRow,
  Stack: MStack,
  Card: MCard,
  Text: MText,
  Input: MInput,
  Image: MImage,
  Button: MButton,
  Slider: MSlider,
  Checkbox: MCheckbox,
  NumberFlow: MNumberFlow,
  GaugeFallback,
  MarqueeHost,
}
export const MColorPicker = createColorPicker(ui, 'native')
export const MGauge = createGauge(ui, 'native')
export const MSwipeDeck = createSwipeDeck(ui, 'native')
export const MTransferList = createTransferList(ui, 'native')
export const MMarquee = createMarquee(ui, 'native')
export const { MTour, MTourTarget } = createTour(
  { ...ui, Popover: MPopover, Host: TourHost, TargetHost },
  'native',
)
