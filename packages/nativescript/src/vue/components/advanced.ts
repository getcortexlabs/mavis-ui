import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  onDeactivated,
  onActivated,
  watch,
  type PropType,
} from 'nativescript-vue'
import {
  type View,
  type EventData,
  type PanGestureEventData,
  type PinchGestureEventData,
  Application,
} from '@nativescript/core'
import {
  createTreeSelect,
  createMasonry,
  createHeatmap,
  createNotificationCenter,
  createImageCropper,
  createScheduler,
  advancedCanvasProps,
  advancedCellProps,
  advancedGestureProps,
  type AdvancedGesture,
} from '@getcortexlabs/mavis-core/vue'
import type { CropSource } from '@getcortexlabs/mavis-core'
import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { loadCropImage } from '../../native/image-crop'
import { schedulerParts } from '../../native/date-format'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'
import { MBox, MColumn, MRow } from './layout.js'
import { MStack } from './MStack.js'
import { MCard } from './MCard.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MInput } from './MInput.js'
import { MImage } from './MImage.js'
import { MCheckbox } from './MCheckbox.js'
import { MSlider } from './MSlider.js'
import { MPopover } from './MPopover.js'

const Host = defineComponent({
  inheritAttrs: false,
  props: { label: String },
  setup(props, { attrs, slots, expose }) {
    let view: View | undefined
    expose({
      focus(id?: string) {
        const target = (id ? view?.getViewById(id) : view) as View | undefined
        if (target) {
          target.focus()
          notifyAccessibilityLayout(target)
        }
      },
    })
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          width: '100%',
          accessibilityLabel: props.label,
          onLoaded: (e: EventData) => (view = e.object as View),
          onUnloaded: () => (view = undefined),
        }),
        slots.default?.(),
      )
  },
})
const Measure = defineComponent({
  emits: ['width'],
  setup(_, { slots, emit }) {
    let last = -1
    const measure = (e: EventData) => {
      const width = (e.object as View).getActualSize().width
      if (Number.isFinite(width) && width > 0 && Math.abs(width - last) > 0.5) {
        last = width
        emit('width', width)
      }
    }
    return () => h('GridLayout', { width: '100%', onLayoutChanged: measure }, slots.default?.())
  },
})
const Canvas = defineComponent({
  props: advancedCanvasProps,
  setup(props, { slots }) {
    return () =>
      h('AbsoluteLayout', { width: props.width ?? '100%', height: props.height }, slots.default?.())
  },
})
const Cell = defineComponent({
  inheritAttrs: false,
  props: advancedCellProps,
  emits: ['height'],
  setup(props, { attrs, slots, emit }) {
    let last = -1
    const measure = (e: EventData) => {
      if (!props.measure) return
      const height = (e.object as View).getActualSize().height
      if (Number.isFinite(height) && height >= 0 && Math.abs(height - last) > 0.5) {
        last = height
        emit('height', height)
      }
    }
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          left: props.x,
          top: props.y,
          width: props.width,
          height: props.height,
          verticalAlignment: 'top',
        }),
        [h(MBox, { width: '100%', height: props.height, onLayoutChanged: measure }, slots)],
      )
  },
})
const Scroll = defineComponent({
  setup(_, { slots }) {
    return () =>
      h(
        'ScrollView',
        { orientation: 'horizontal', width: '100%', scrollBarIndicatorVisible: true },
        [h('StackLayout', { orientation: 'horizontal' }, slots.default?.())],
      )
  },
})
const Gesture = defineComponent({
  inheritAttrs: false,
  props: advancedGestureProps,
  emits: ['gesture', 'step'],
  setup(props, { attrs, slots, emit }) {
    const active = new Set<string>()
    let last = { x: 0, y: 0, scale: 1 }
    function send(phase: AdvancedGesture['phase']) {
      emit('gesture', { phase, ...last })
    }
    function cancel() {
      if (active.size) send('cancel')
      active.clear()
      last = { x: 0, y: 0, scale: 1 }
    }
    function update(name: string, state: number, value: Partial<typeof last>) {
      if (props.disabled) return
      if (state === 1) {
        if (!active.size) {
          last = { x: 0, y: 0, scale: 1 }
          send('start')
        }
        active.add(name)
      }
      if (state === 2 && active.has(name)) {
        last = { ...last, ...value }
        send('move')
      }
      if (state === 3 && active.has(name)) {
        active.delete(name)
        if (!active.size) {
          send('end')
          last = { x: 0, y: 0, scale: 1 }
        }
      }
      if (state === 4) cancel()
    }
    let listening = false
    function loaded() {
      if (listening) return
      listening = true
      Application.on(Application.suspendEvent, cancel)
    }
    function unloaded() {
      listening = false
      cancel()
      Application.off(Application.suspendEvent, cancel)
    }
    onBeforeUnmount(unloaded)
    onDeactivated(unloaded)
    onActivated(loaded)
    watch(() => props.disabled, cancel)
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          accessibilityLabel: props.label,
          accessible: true,
          isEnabled: !props.disabled,
          onLoaded: loaded,
          onUnloaded: unloaded,
          onPan: (e: PanGestureEventData) => update('pan', e.state, { x: e.deltaX, y: e.deltaY }),
          onPinch: (e: PinchGestureEventData) => update('pinch', e.state, { scale: e.scale }),
          onTouch: (e: { action: string }) => {
            if (e.action === 'cancel') cancel()
          },
        }),
        slots.default?.(),
      )
  },
})
const CropPreview = defineComponent({
  props: {
    source: { type: Object as PropType<CropSource>, required: true },
    width: Number,
    height: Number,
    motionSurface: Object as PropType<MotionSurface>,
  },
  setup(props) {
    return () =>
      h('AbsoluteLayout', { width: '100%', height: '100%', isUserInteractionEnabled: false }, [
        h(
          MBox,
          {
            left: 0,
            top: 0,
            width: props.width,
            height: props.height,
            motionSurface: props.motionSurface,
          },
          () =>
            h('Image', {
              src: props.source!.preview,
              width: props.width,
              height: props.height,
              stretch: 'fill',
              accessible: false,
            }),
        ),
      ])
  },
})
const ui = {
  Box: MBox,
  Column: MColumn,
  Row: MRow,
  Stack: MStack,
  Card: MCard,
  Text: MText,
  Button: MButton,
  Input: MInput,
  Image: MImage,
  Checkbox: MCheckbox,
  Slider: MSlider,
  Popover: MPopover,
  Segmented: MBox,
  Host,
  Measure,
  Cell,
  Canvas,
  Scroll,
  Gesture,
  CropPreview,
}
export const MTreeSelect = createTreeSelect(ui, 'native')
export const MMasonry = createMasonry(ui, 'native')
export const MHeatmap = createHeatmap(ui, 'native')
export const MNotificationCenter = createNotificationCenter(ui, 'native')
export const MImageCropper = createImageCropper(ui, 'native', loadCropImage)
export const MScheduler = createScheduler(ui, 'native', {
  parts: (instant, timeZone) => schedulerParts(instant, { timeZone }),
})
