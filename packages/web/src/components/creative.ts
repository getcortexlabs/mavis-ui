import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  ref,
  watch,
  type PropType,
} from 'vue'
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
    geometry: { type: Object as PropType<ReturnType<typeof gaugeGeometry>>, required: true },
    size: Number,
    strokeWidth: Number,
    color: String,
    track: String,
    hidden: Boolean,
  },
  setup(props) {
    return () =>
      h(
        'svg',
        {
          viewBox: props.geometry.viewBox.join(' '),
          width: '100%',
          height: '100%',
          'aria-hidden': true,
          style: { gridArea: '1 / 1', visibility: props.hidden ? 'hidden' : 'visible' },
        },
        [
          h('path', {
            d: props.geometry.path,
            fill: 'none',
            stroke: props.track,
            'stroke-width': props.strokeWidth,
            'stroke-linecap': 'round',
          }),
          h('path', {
            d: props.geometry.path,
            fill: 'none',
            stroke: props.color,
            'stroke-width': props.strokeWidth,
            'stroke-linecap': 'round',
            pathLength: 1,
            'stroke-dasharray': `${props.geometry.ratio} 1`,
          }),
        ],
      )
  },
})
const TourHost = defineComponent({
  inheritAttrs: false,
  props: tourHostProps,
  setup(props, { attrs, slots }) {
    let saved: HTMLElement | null = null,
      lastFocused: HTMLElement | null = null
    const remember = (event: Event) => {
      if (props.active) return
      const element =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(
              'button, a[href], input, select, textarea, [tabindex]',
            )
          : null
      if (element) lastFocused = element
    }
    onMounted(() => {
      document.addEventListener('focusin', remember, true)
      document.addEventListener('pointerdown', remember, true)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('focusin', remember, true)
      document.removeEventListener('pointerdown', remember, true)
    })
    watch(
      () => props.active,
      (active, wasActive) => {
        if (typeof document === 'undefined') return
        if (active && !wasActive)
          saved =
            document.activeElement instanceof HTMLElement &&
            document.activeElement !== document.body
              ? document.activeElement
              : lastFocused
        else if (!active)
          void nextTick(() => {
            if (!props.active && props.restoreFocus && saved?.isConnected)
              saved.focus({ preventScroll: true })
            saved = null
          })
      },
      { immediate: true, flush: 'pre' },
    )
    return () => h('div', attrs, slots.default?.())
  },
})
const TargetHost = defineComponent({
  inheritAttrs: false,
  props: tourHostProps,
  setup(props, { attrs, slots }) {
    const root = ref<HTMLElement>()
    const reveal = () => {
      if (props.active)
        root.value?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    }
    watch(
      () => props.active,
      () => void nextTick(reveal),
      { flush: 'post' },
    )
    onMounted(reveal)
    return () => h('div', mergeProps(attrs, { ref: root }), slots.default?.())
  },
})
const MarqueeHost = defineComponent({
  inheritAttrs: false,
  props: marqueeHostProps,
  emits: ['environment'],
  setup(_props, { attrs, slots, emit }) {
    const root = ref<HTMLElement>()
    let media: MediaQueryList | undefined,
      resize: ResizeObserver | undefined,
      intersection: IntersectionObserver | undefined
    let hovered = false,
      focused = false,
      visible = true,
      attached = false
    const update = () =>
      emit('environment', {
        reduced: media?.matches ?? true,
        paused: !attached || document.hidden || hovered || focused || !visible,
        width: root.value?.clientWidth ?? 0,
      })
    function attach() {
      if (attached || !root.value) return
      attached = true
      media = matchMedia('(prefers-reduced-motion: reduce)')
      media.addEventListener('change', update)
      resize = new ResizeObserver(update)
      resize.observe(root.value)
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? false
        update()
      })
      intersection.observe(root.value)
      document.addEventListener('visibilitychange', update)
      update()
    }
    function detach() {
      attached = false
      media?.removeEventListener('change', update)
      resize?.disconnect()
      intersection?.disconnect()
      document.removeEventListener('visibilitychange', update)
      update()
    }
    onMounted(attach)
    onActivated(attach)
    onDeactivated(detach)
    onBeforeUnmount(detach)
    return () =>
      h(
        'div',
        mergeProps(attrs, {
          ref: root,
          style: { overflow: 'hidden', minWidth: 0, width: '100%' },
          onMouseenter: () => {
            hovered = true
            update()
          },
          onMouseleave: () => {
            hovered = false
            update()
          },
          onFocusin: () => {
            focused = true
            update()
          },
          onFocusout: (event: FocusEvent) => {
            focused =
              event.relatedTarget instanceof Node && !!root.value?.contains(event.relatedTarget)
            update()
          },
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
export const MColorPicker = createColorPicker(ui, 'web')
export const MGauge = createGauge(ui, 'web')
export const MSwipeDeck = createSwipeDeck(ui, 'web')
export const MTransferList = createTransferList(ui, 'web')
export const MMarquee = createMarquee(ui, 'web')
export const { MTour, MTourTarget } = createTour(
  { ...ui, Popover: MPopover, Host: TourHost, TargetHost },
  'web',
)
