import {
  defineComponent,
  h,
  inject,
  markRaw,
  mergeProps,
  onBeforeUnmount,
  onDeactivated,
  onScopeDispose,
  watch,
} from 'nativescript-vue'
import {
  Application,
  type View,
  type EventData,
  type PanGestureEventData,
} from '@nativescript/core'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'
import { reducedMotion, onReducedMotion } from '@rafaelaugusto/jolt'
import {
  createDashboardShape,
  createDonutChart,
  createSparkline,
  createDashboardEffects,
  createKanban,
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
  setup: () => () => h('GridLayout', { accessible: false, isUserInteractionEnabled: false }),
})
const Environment = defineComponent({
  inheritAttrs: false,
  props: dashboardEnvironmentProps,
  emits: ['environment'],
  setup(_props, { attrs, slots, emit }) {
    let attached = false,
      suspended = false,
      release = () => {}
    const update = () =>
      emit('environment', { reduced: reducedMotion(), paused: !attached || suspended })
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
      release = () => {}
      Application.off(Application.suspendEvent, suspend)
      Application.off(Application.resumeEvent, resume)
      update()
    }
    function attach() {
      if (attached) return
      attached = true
      release = onReducedMotion(update)
      Application.on(Application.suspendEvent, suspend)
      Application.on(Application.resumeEvent, resume)
      update()
    }
    onBeforeUnmount(detach)
    onDeactivated(detach)
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, { width: '100%', onLoaded: attach, onUnloaded: detach }),
        slots.default?.(),
      )
  },
})
function rect(view?: View) {
  if (!view?.isLoaded) return
  const p = view.getLocationOnScreen(),
    size = view.getActualSize()
  return p ? { ...p, ...size } : undefined
}
const Zone = defineComponent({
  inheritAttrs: false,
  props: kanbanZoneProps,
  setup(props, { attrs, slots }) {
    const registry = inject(kanbanRegistryKey)!
    let view: View | undefined
    onBeforeUnmount(() => registry.zones.delete(props.column))
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          onLoaded: (e: EventData) => {
            view = e.object as View
            registry.zones.set(props.column, () => rect(view))
          },
          onUnloaded: () => {
            view = undefined
            registry.zones.delete(props.column)
          },
        }),
        slots.default?.(),
      )
  },
})
const Drag = defineComponent({
  inheritAttrs: false,
  props: kanbanDragProps,
  setup(props, { attrs, slots }) {
    const registry = inject(kanbanRegistryKey)!,
      surface = markRaw(createMotionSurface())
    let view: View | undefined,
      anchor: ReturnType<typeof rect>,
      dragging = false
    function end(commit = false) {
      const was = dragging
      dragging = false
      if (surface.available) {
        if (props.animated && !commit)
          surface.animate({ x: 0, y: 0, scale: 1 }, { type: 'spring', duration: 280, bounce: 0.12 })
        else surface.set({ x: 0, y: 0, scale: 1 })
      }
      if (view) view.style.zIndex = 0
      if (was) registry.finish(commit)
    }
    const cancel = () => end(false)
    onBeforeUnmount(() => {
      cancel()
      registry.cards.delete(props.cardId)
      registry.focus.delete(props.cardId)
    })
    onDeactivated(cancel)
    onScopeDispose(surface.use(() => cancel))
    watch(
      () => props.disabled,
      (value) => {
        if (value) cancel()
      },
    )
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          onLoaded: (e: EventData) => {
            view = e.object as View
            registry.cards.set(props.cardId, () => rect(view))
            registry.focus.set(props.cardId, () => {
              if (view) notifyAccessibilityLayout(view)
            })
          },
          onUnloaded: () => {
            cancel()
            view = undefined
            registry.cards.delete(props.cardId)
            registry.focus.delete(props.cardId)
          },
        }),
        [
          h(MBox, { motionSurface: surface }, () =>
            h(MColumn, { gap: 'xs' }, () => [
              h(
                MBox,
                {
                  height: 36,
                  accessibilityHidden: true,
                  accessibilityLabel: props.label,
                  opacity: props.disabled ? 0.4 : 0.65,
                  onPan: (e: PanGestureEventData) => {
                    if (props.disabled) return
                    if (e.state === 1) {
                      anchor = rect(view)
                      dragging = registry.begin(props.cardId, cancel)
                      if (dragging && view) view.style.zIndex = 20
                    }
                    if (e.state === 2 && dragging && surface.available) {
                      const current = rect(view)
                      surface.set({
                        x: e.deltaX + (anchor && current ? anchor.x - current.x : 0),
                        y: e.deltaY + (anchor && current ? anchor.y - current.y : 0),
                        scale: 1.02,
                      })
                      registry.move(e.deltaX, e.deltaY)
                    }
                    if (e.state === 3) end(true)
                    if (e.state === 4) cancel()
                  },
                },
                () => h(MText, { text: '⠿', textAlignment: 'center' }),
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
    const measure = (event: EventData) =>
      emit('width', (event.object as View).getActualSize().width)
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          height: props.height,
          width: '100%',
          clipToBounds: true,
          accessible: false,
          isUserInteractionEnabled: false,
          onLoaded: measure,
          onLayoutChanged: measure,
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
  Shape: createDashboardShape(MBox, Fallback, 'native'),
  Environment,
  Plot,
}
export const MDonutChart = createDonutChart(ui, 'native')
export const MSparkline = createSparkline(ui, 'native')
export const { MGradientBackground, MParticleField, MConfetti } = createDashboardEffects(
  ui,
  'native',
)
export const MKanban = createKanban({ ...ui, Zone, Drag, Menu: MMenu }, 'native')
