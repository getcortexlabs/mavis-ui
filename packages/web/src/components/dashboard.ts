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
  type KanbanRegistry,
} from '@getcortexlabs/mavis-core/vue'
import type { WebRuntime } from '@rafaelaugusto/jolt/web'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { MBox, MColumn, MRow } from './layout.js'
import { useMotionContext } from '../motion-context.js'
import { useConnectedMotion } from '../connected-motion.js'
import { followReducedMotion } from '../reduced-motion.js'
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
      follow: ReturnType<typeof followReducedMotion> | undefined,
      observer: IntersectionObserver | undefined
    const context = useMotionContext()
    function update() {
      emit('environment', {
        reduced: follow?.reduced ?? true,
        paused: !attached || document.hidden || !visible,
      })
    }
    function connect() {
      if (attached || !root.value) return
      attached = true
      follow = followReducedMotion(context, root.value.ownerDocument, update)
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
      follow?.release()
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
    const registry = inject(kanbanRegistryKey)! as KanbanRegistry<HTMLElement>,
      root = ref<HTMLElement>()
    onMounted(() => {
      registry.zones.set(props.column, root.value!)
      registry.revision.value++
    })
    onBeforeUnmount(() => {
      registry.zones.delete(props.column)
      registry.revision.value++
    })
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
    const registry = inject(kanbanRegistryKey)! as KanbanRegistry<HTMLElement>,
      root = ref<HTMLElement>(),
      surface = markRaw(createMotionSurface()),
      dragging = ref(false)
    let runtime: WebRuntime | undefined,
      zones: ReturnType<WebRuntime['dropZones']> | undefined,
      live = false
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    }
    // Jolt cancels on these and leaves the card where it was; the board brings it back.
    const interrupted = () => {
      if (live) cancel()
    }
    function watchInput(on: boolean) {
      const listen = on ? 'addEventListener' : 'removeEventListener'
      window[listen]('keydown', escape as EventListener)
      window[listen]('blur', interrupted)
      window[listen]('resize', interrupted)
      window[listen]('scroll', interrupted, true)
      document[listen]('visibilitychange', interrupted)
    }
    function settle() {
      if (live) watchInput(false)
      live = false
      dragging.value = false
    }
    function rest(animated: boolean) {
      if (!surface.available) return
      if (animated && props.animated)
        surface.animate({ x: 0, y: 0, scale: 1 }, { type: 'spring', duration: 280, bounce: 0.12 })
      else surface.set({ x: 0, y: 0, scale: 1 })
    }
    function cancel() {
      const was = live
      settle()
      zones?.cancel()
      if (!was) return
      rest(true)
      registry.finish(props.cardId)
    }
    function release() {
      zones?.dispose()
      zones = undefined
    }
    // Jolt refuses a drag under a transformed ancestor, so each contact gets fresh drop zones,
    // after ending the layout motion that may still be moving the card's column.
    function attach(handle: HTMLElement) {
      if (live) return
      release()
      const source = root.value?.firstElementChild
      if (!runtime || !(source instanceof HTMLElement)) return
      for (let node = source.parentElement; node?.parentElement; node = node.parentElement) {
        if (!new DOMMatrixReadOnly(getComputedStyle(node).transform).isIdentity)
          runtime.animateLayout(node.parentElement).stop()
        if (node.classList.contains('m-kanban')) break
      }
      const targets = registry.targets(props.cardId)
      if (!targets.length) return
      try {
        zones = runtime.dropZones(source, {
          targets,
          drag: { handle, snap: [0] },
          onMove({ id, bounds }) {
            if (!live) {
              if (!registry.begin(props.cardId, cancel)) {
                zones?.cancel()
                return
              }
              live = true
              dragging.value = true
              watchInput(true)
              if (surface.available) surface.set({ scale: 1.02 })
            }
            registry.move(id, bounds)
          },
          onLeave: () => registry.leave(),
          onDrop() {
            settle()
            rest(false)
            registry.drop()
          },
          onReject() {
            settle()
            registry.finish(props.cardId)
            if (!surface.available) return
            if (props.animated)
              surface.animate({ scale: 1 }, { type: 'spring', duration: 280, bounce: 0.12 })
            // Jolt starts its return after this callback; without motion the card goes back at once.
            else
              queueMicrotask(() => {
                zones?.cancel()
                rest(false)
              })
          },
        })
      } catch {
        zones = undefined
      }
    }
    useConnectedMotion(root, useMotionContext(), (owner) => {
      runtime = owner
      return () => {
        cancel()
        release()
        runtime = undefined
      }
    })
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
    watch(
      () => props.disabled,
      (value) => {
        if (!value) return
        cancel()
        release()
      },
    )
    return () =>
      h(
        'div',
        mergeProps(attrs, {
          ref: root,
          'data-kanban-card': props.cardId,
          style: { position: 'relative', zIndex: dragging.value ? 20 : undefined },
          onPointerdownCapture: (e: PointerEvent) => {
            const handle =
              e.target instanceof Element ? e.target.closest('[data-kanban-handle]') : null
            if (
              !(handle instanceof HTMLElement) ||
              props.disabled ||
              e.button !== 0 ||
              !e.isPrimary
            )
              return
            handle.focus({ preventScroll: true })
            attach(handle)
          },
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
                  onLostpointercapture: interrupted,
                  // Safari moves focus to the page on mouse down; the grip keeps it for the arrow keys.
                  onMousedown: (e: MouseEvent) => e.preventDefault(),
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
