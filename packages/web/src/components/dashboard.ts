import {
  defineComponent,
  h,
  inject,
  markRaw,
  mergeProps,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  onScopeDispose,
  ref,
  watch,
} from 'vue'
import {
  createDashboardShape,
  createDonutChart,
  createSparkline,
  createDashboardEffects,
  createKanban,
  dashboardShapeProps,
  dashboardEnvironmentProps,
  dashboardPlotProps,
  kanbanRegistryKey,
  kanbanZoneProps,
  kanbanDragProps,
} from '@getcortexlabs/mavis-core/vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { MBox, MColumn, MRow } from './layout.js'
import { MStack } from './MStack.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MNumberFlow } from './interactive.js'
import { MMenu } from './navigation.js'

const Fallback = defineComponent({
  props: { ...dashboardShapeProps, hidden: Boolean },
  setup(props) {
    return () =>
      h(
        'svg',
        {
          viewBox: props.viewBox.join(' '),
          preserveAspectRatio: 'none',
          'aria-hidden': true,
          focusable: false,
          style: {
            display: 'block',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            visibility: props.hidden ? 'hidden' : undefined,
          },
        },
        [
          h('path', {
            d: props.d,
            fill: 'none',
            stroke: props.color,
            'stroke-width': props.strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            pathLength: 1,
            'stroke-dasharray': `${Math.max(0, props.end - props.start)} 1`,
            'stroke-dashoffset': -props.start,
          }),
        ],
      )
  },
})
const Environment = defineComponent({
  inheritAttrs: false,
  props: dashboardEnvironmentProps,
  emits: ['environment'],
  setup(_props, { attrs, slots, emit }) {
    const root = ref<HTMLElement>()
    let attached = false,
      visible = true,
      media: MediaQueryList | undefined,
      observer: IntersectionObserver | undefined
    function update() {
      emit('environment', {
        reduced: media?.matches ?? true,
        paused: !attached || document.hidden || !visible,
      })
    }
    function connect() {
      if (attached || !root.value) return
      attached = true
      media = matchMedia('(prefers-reduced-motion: reduce)')
      media.addEventListener('change', update)
      document.addEventListener('visibilitychange', update)
      observer = new IntersectionObserver(([entry]) => {
        const next = entry?.isIntersecting ?? false
        if (next !== visible) {
          visible = next
          update()
        }
      })
      observer.observe(root.value)
      update()
    }
    function disconnect() {
      attached = false
      media?.removeEventListener('change', update)
      observer?.disconnect()
      document.removeEventListener('visibilitychange', update)
      update()
    }
    onMounted(connect)
    onActivated(connect)
    onDeactivated(disconnect)
    onBeforeUnmount(disconnect)
    return () =>
      h(
        'div',
        mergeProps(attrs, { ref: root, style: { minWidth: 0, width: '100%' } }),
        slots.default?.(),
      )
  },
})
const Zone = defineComponent({
  inheritAttrs: false,
  props: kanbanZoneProps,
  setup(props, { attrs, slots }) {
    const registry = inject(kanbanRegistryKey)!,
      root = ref<HTMLElement>()
    onMounted(() => registry.zones.set(props.column, () => root.value?.getBoundingClientRect()))
    onBeforeUnmount(() => registry.zones.delete(props.column))
    return () =>
      h(
        'div',
        mergeProps(attrs, { ref: root, 'data-kanban-column': props.column }),
        slots.default?.(),
      )
  },
})
const Drag = defineComponent({
  inheritAttrs: false,
  props: kanbanDragProps,
  setup(props, { attrs, slots }) {
    const registry = inject(kanbanRegistryKey)!,
      root = ref<HTMLElement>(),
      surface = markRaw(createMotionSurface()),
      dragging = ref(false)
    let pointer: number | undefined,
      anchor: DOMRect | undefined,
      startX = 0,
      startY = 0,
      handle: HTMLElement | undefined
    function end(commit = false) {
      const was = dragging.value
      dragging.value = false
      const id = pointer
      pointer = undefined
      if (id !== undefined && handle?.hasPointerCapture(id)) handle.releasePointerCapture(id)
      window.removeEventListener('keydown', escape)
      window.removeEventListener('scroll', cancel, true)
      window.removeEventListener('resize', cancel)
      if (surface.available) {
        if (props.animated && !commit)
          surface.animate({ x: 0, y: 0, scale: 1 }, { type: 'spring', duration: 280, bounce: 0.12 })
        else surface.set({ x: 0, y: 0, scale: 1 })
      }
      if (was) registry.finish(commit)
    }
    const cancel = () => end(false)
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    }
    onMounted(() => {
      registry.cards.set(props.cardId, () => root.value?.getBoundingClientRect())
      registry.focus.set(props.cardId, () =>
        root.value
          ?.querySelector<HTMLElement>('button:not(:disabled)')
          ?.focus({ preventScroll: true }),
      )
    })
    onBeforeUnmount(() => {
      cancel()
      registry.cards.delete(props.cardId)
      registry.focus.delete(props.cardId)
    })
    onDeactivated(cancel)
    onScopeDispose(
      surface.use(() => () => {
        if (dragging.value) cancel()
      }),
    )
    watch(
      () => props.disabled,
      (value) => {
        if (value) cancel()
      },
    )
    return () =>
      h(
        'div',
        mergeProps(attrs, {
          ref: root,
          'data-kanban-card': props.cardId,
          style: { position: 'relative', zIndex: dragging.value ? 20 : undefined },
        }),
        [
          h(MBox, { motionSurface: surface }, () =>
            h(MColumn, { gap: 'xs' }, () => [
              h(
                'button',
                {
                  type: 'button',
                  disabled: props.disabled,
                  'aria-label': props.label,
                  'data-kanban-handle': props.cardId,
                  style: {
                    touchAction: 'none',
                    cursor: props.disabled ? 'default' : dragging.value ? 'grabbing' : 'grab',
                    minHeight: '36px',
                    width: '100%',
                    borderRadius: '8px',
                    color: 'inherit',
                    background: 'transparent',
                    border: '0',
                    opacity: props.disabled ? 0.4 : 0.65,
                  },
                  onPointerdown: (e: PointerEvent) => {
                    if (props.disabled || e.button !== 0 || !e.isPrimary || pointer !== undefined)
                      return
                    e.preventDefault()
                    handle = e.currentTarget as HTMLElement
                    handle.focus({ preventScroll: true })
                    pointer = e.pointerId
                    startX = e.clientX
                    startY = e.clientY
                    handle.setPointerCapture(pointer)
                    window.addEventListener('keydown', escape)
                    window.addEventListener('scroll', cancel, true)
                    window.addEventListener('resize', cancel)
                  },
                  onPointermove: (e: PointerEvent) => {
                    if (e.pointerId !== pointer) return
                    const x = e.clientX - startX,
                      y = e.clientY - startY
                    if (!dragging.value && Math.hypot(x, y) >= 6) {
                      if (!registry.begin(props.cardId, cancel)) {
                        cancel()
                        return
                      }
                      anchor = root.value?.getBoundingClientRect()
                      dragging.value = true
                    }
                    if (dragging.value && surface.available) {
                      const current = root.value?.getBoundingClientRect()
                      surface.set({
                        x: x + (anchor && current ? anchor.x - current.x : 0),
                        y: y + (anchor && current ? anchor.y - current.y : 0),
                        scale: 1.02,
                      })
                      registry.move(x, y)
                    }
                  },
                  onPointerup: (e: PointerEvent) => {
                    if (e.pointerId === pointer) end(true)
                  },
                  onPointercancel: cancel,
                  onLostpointercapture: () => {
                    if (pointer !== undefined) cancel()
                  },
                  onKeydown: (e: KeyboardEvent) => {
                    const direction = (
                      {
                        ArrowUp: 'up',
                        ArrowDown: 'down',
                        ArrowLeft: 'left',
                        ArrowRight: 'right',
                      } as const
                    )[e.key as 'ArrowUp']
                    if (direction && !props.disabled) {
                      e.preventDefault()
                      registry.keyboard(props.cardId, direction)
                    }
                  },
                },
                '⠿',
              ),
              ...(slots.default?.() ?? []),
            ]),
          ),
        ],
      )
  },
})
const Plot = defineComponent({
  inheritAttrs: false,
  props: dashboardPlotProps,
  emits: ['width'],
  setup(props, { attrs, slots, emit }) {
    const root = ref<HTMLElement>()
    let observer: ResizeObserver | undefined
    function connect() {
      if (observer || !root.value) return
      const measure = () => emit('width', root.value?.clientWidth ?? 0)
      observer = new ResizeObserver(measure)
      observer.observe(root.value)
      measure()
    }
    function disconnect() {
      observer?.disconnect()
      observer = undefined
    }
    onMounted(connect)
    onActivated(connect)
    onDeactivated(disconnect)
    onBeforeUnmount(disconnect)
    return () =>
      h(
        'div',
        mergeProps(attrs, {
          ref: root,
          'data-sparkline-plot': '',
          style: {
            height: props.height + 'px',
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            display: 'grid',
            position: 'relative',
            overflow: 'hidden',
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
  Text: MText,
  Button: MButton,
  NumberFlow: MNumberFlow,
  Shape: createDashboardShape(MBox, Fallback, 'web'),
  Environment,
  Plot,
}
export const MDonutChart = createDonutChart(ui, 'web')
export const MSparkline = createSparkline(ui, 'web')
export const { MGradientBackground, MParticleField, MConfetti } = createDashboardEffects(ui, 'web')
export const MKanban = createKanban({ ...ui, Zone, Drag, Menu: MMenu }, 'web')
