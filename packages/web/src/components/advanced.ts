import {
  defineComponent,
  h,
  mergeProps,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  ref,
  watch,
  type PropType,
} from 'vue'
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
import { civilDate, type CropSource, type SchedulerClock } from '@getcortexlabs/mavis-core'
import type { MotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { loadCropImage } from '../image-crop.js'
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
    const root = ref<HTMLElement>()
    expose({
      focus(id?: string) {
        const el = id ? root.value?.ownerDocument.getElementById(id) : root.value
        if (el && root.value?.contains(el)) el.focus({ preventScroll: true })
      },
    })
    return () =>
      h(
        'section',
        mergeProps(attrs, {
          ref: root,
          'aria-label': props.label,
          tabindex: -1,
          style: { minWidth: 0 },
        }),
        slots.default?.(),
      )
  },
})
function measured(cell: boolean) {
  return defineComponent({
    inheritAttrs: false,
    props: { ...advancedCellProps, width: { type: Number, default: 0 } },
    emits: ['width', 'height'],
    setup(props, { attrs, slots, emit }) {
      const root = ref<HTMLElement>()
      let observer: ResizeObserver | undefined,
        last = -1,
        frame = 0
      function measure() {
        const el = root.value
        if (!el) return
        if (cell && !props.measure) return
        const v = cell ? el.offsetHeight : el.clientWidth
        if (Math.abs(v - last) > 0.5) {
          last = v
          emit(cell ? 'height' : 'width', v)
        }
      }
      function detach() {
        cancelAnimationFrame(frame)
        frame = 0
        observer?.disconnect()
        observer = undefined
      }
      function schedule() {
        if (!frame)
          frame = requestAnimationFrame(() => {
            frame = 0
            measure()
          })
      }
      function attach() {
        detach()
        if (!root.value) return
        if (cell && !props.measure) return
        observer = new ResizeObserver(schedule)
        observer.observe(root.value)
        schedule()
      }
      onMounted(attach)
      onActivated(attach)
      onDeactivated(detach)
      onBeforeUnmount(detach)
      return () =>
        cell
          ? h(
              'div',
              mergeProps(attrs, {
                style: {
                  position: 'absolute',
                  left: `${props.x}px`,
                  top: `${props.y}px`,
                  width: `${props.width}px`,
                  height: props.height === undefined ? undefined : `${props.height}px`,
                },
              }),
              h(
                MBox,
                { width: '100%', height: props.height === undefined ? undefined : '100%' },
                () =>
                  h(
                    'div',
                    {
                      ref: root,
                      style: {
                        display: 'flow-root',
                        height: props.height === undefined ? undefined : '100%',
                        minWidth: 0,
                      },
                    },
                    slots.default?.(),
                  ),
              ),
            )
          : h(
              'div',
              mergeProps(attrs, { ref: root, style: { minWidth: 0, width: '100%' } }),
              slots.default?.(),
            )
    },
  })
}
const Measure = measured(false),
  Cell = measured(true)
const Canvas = defineComponent({
  props: advancedCanvasProps,
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        {
          style: {
            position: 'relative',
            height: `${props.height}px`,
            width: props.width === undefined ? '100%' : `${props.width}px`,
          },
        },
        slots.default?.(),
      )
  },
})
const Scroll = defineComponent({
  setup(_, { slots }) {
    return () =>
      h('div', { style: { overflowX: 'auto', minWidth: 0, maxWidth: '100%' } }, slots.default?.())
  },
})
const Gesture = defineComponent({
  inheritAttrs: false,
  props: advancedGestureProps,
  emits: ['gesture', 'step'],
  setup(props, { attrs, slots, emit }) {
    const root = ref<HTMLElement>()
    const points = new Map<number, { x: number; y: number }>()
    let origin = { x: 0, y: 0 },
      distance = 0,
      last = { x: 0, y: 0, scale: 1 },
      active = false
    function metrics() {
      const values = [...points.values()]
      return {
        x: values.reduce((a, p) => a + p.x, 0) / values.length,
        y: values.reduce((a, p) => a + p.y, 0) / values.length,
        distance:
          values.length === 2
            ? Math.hypot(values[0]!.x - values[1]!.x, values[0]!.y - values[1]!.y)
            : 0,
      }
    }
    function send(phase: AdvancedGesture['phase']) {
      emit('gesture', { phase, ...last })
    }
    function clear(cancel = true) {
      if (active) {
        active = false
        send(cancel ? 'cancel' : 'end')
      }
      for (const id of points.keys()) {
        if (root.value?.hasPointerCapture(id)) root.value.releasePointerCapture(id)
      }
      points.clear()
      distance = 0
      last = { x: 0, y: 0, scale: 1 }
    }
    function down(e: PointerEvent) {
      if (props.disabled || e.button !== 0 || points.size >= 2) return
      e.preventDefault()
      root.value?.focus({ preventScroll: true })
      points.set(e.pointerId, { x: e.clientX, y: e.clientY })
      root.value?.setPointerCapture(e.pointerId)
      const m = metrics()
      origin = { x: m.x - last.x, y: m.y - last.y }
      distance = m.distance / last.scale
      if (!active) {
        active = true
        send('start')
      }
    }
    function move(e: PointerEvent) {
      if (!points.has(e.pointerId)) return
      points.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const m = metrics()
      last = {
        x: m.x - origin.x,
        y: m.y - origin.y,
        scale: distance && m.distance ? m.distance / distance : last.scale,
      }
      send('move')
    }
    function up(e: PointerEvent) {
      if (!points.has(e.pointerId)) return
      if (points.size === 1) {
        clear(false)
        return
      }
      points.delete(e.pointerId)
      if (root.value?.hasPointerCapture(e.pointerId)) root.value.releasePointerCapture(e.pointerId)
      const m = metrics()
      origin = { x: m.x - last.x, y: m.y - last.y }
      distance = 0
    }
    function cancel() {
      clear()
    }
    function attach() {
      window.addEventListener('resize', cancel)
      window.addEventListener('blur', cancel)
      window.addEventListener('scroll', cancel, true)
    }
    function detach() {
      cancel()
      window.removeEventListener('resize', cancel)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('scroll', cancel, true)
    }
    onMounted(attach)
    onActivated(attach)
    onDeactivated(detach)
    onBeforeUnmount(detach)
    watch(() => props.disabled, cancel)
    return () =>
      h(
        'div',
        mergeProps(attrs, {
          ref: root,
          role: 'group',
          'aria-label': props.label,
          'aria-disabled': props.disabled || undefined,
          tabindex: props.disabled ? -1 : 0,
          style: {
            touchAction: props.disabled ? 'auto' : 'none',
            cursor: props.disabled ? 'default' : 'grab',
            userSelect: 'none',
          },
          onPointerdown: down,
          onPointermove: move,
          onPointerup: up,
          onPointercancel: cancel,
          onLostpointercapture: (e: PointerEvent) => {
            if (points.has(e.pointerId)) cancel()
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
            if (props.disabled) return
            const d: Record<string, [number, number]> = {
              ArrowLeft: [-1, 0],
              ArrowRight: [1, 0],
              ArrowUp: [0, -1],
              ArrowDown: [0, 1],
            }
            if (d[e.key]) {
              e.preventDefault()
              emit('step', { x: d[e.key]![0], y: d[e.key]![1] })
            }
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
      h(
        MBox,
        {
          width: props.width,
          height: props.height,
          motionSurface: props.motionSurface,
          style: { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' },
        },
        () =>
          h('img', {
            src: props.source!.preview,
            alt: '',
            draggable: false,
            width: props.width,
            height: props.height,
            style: { display: 'block', maxWidth: 'none', width: '100%', height: '100%' },
          }),
      )
  },
})
const formats = new Map<string, Intl.DateTimeFormat>()
export const schedulerClock: SchedulerClock = {
  parts(instant, timeZone) {
    let format = formats.get(timeZone)
    if (!format) {
      format = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
      if (formats.size >= 32) formats.clear()
      formats.set(timeZone, format)
    }
    const parts = Object.fromEntries(format.formatToParts(instant).map((p) => [p.type, p.value]))
    return {
      date: civilDate(`${parts.year!.padStart(4, '0')}-${parts.month}-${parts.day}`),
      minute: Number(parts.hour) * 60 + Number(parts.minute),
    }
  },
}
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
export const MTreeSelect = createTreeSelect(ui, 'web')
export const MMasonry = createMasonry(ui, 'web')
export const MHeatmap = createHeatmap(ui, 'web')
export const MNotificationCenter = createNotificationCenter(ui, 'web')
export const MImageCropper = createImageCropper(ui, 'web', loadCropImage)
export const MScheduler = createScheduler(ui, 'web', schedulerClock)
