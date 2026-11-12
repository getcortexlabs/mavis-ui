import {
  defineComponent,
  h,
  inject,
  markRaw,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onScopeDispose,
  watch,
} from 'nativescript-vue'
import {
  Application,
  isAndroid,
  type View,
  type EventData,
  type LayoutBase,
  type TouchGestureEventData,
} from '@nativescript/core'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'
import { dropZones, reducedMotion, onReducedMotion, type DropZones } from '@rafaelaugusto/jolt'
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
  type KanbanRegistry,
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
  const p = view.getLocationInWindow(),
    size = view.getActualSize()
  return p ? { ...p, ...size } : undefined
}
// A dragged card leaves its column: nothing between the card and the board may clip it.
// On Android a clipped source counts as hidden and Jolt cancels the drag.
function unclip(source: View, columns: readonly View[]) {
  const show = (view: View) => {
    if (isAndroid) {
      const group = view.android as { setClipChildren?(clip: boolean): void } & {
        setClipToPadding?(clip: boolean): void
      }
      group?.setClipChildren?.(false)
      group?.setClipToPadding?.(false)
    } else (view as LayoutBase).clipToBounds = false
  }
  for (let view = source.parent as View | undefined; view; view = view.parent as View | undefined) {
    show(view)
    if (columns.includes(view)) {
      if (view.parent) show(view.parent as View)
      break
    }
  }
}
const Zone = defineComponent({
  inheritAttrs: false,
  props: kanbanZoneProps,
  setup(props, { attrs, slots }) {
    const registry = inject(kanbanRegistryKey)! as KanbanRegistry<View>
    const leave = () => {
      if (registry.zones.delete(props.column)) registry.revision.value++
    }
    onBeforeUnmount(leave)
    return () =>
      h(
        'GridLayout',
        mergeProps(attrs, {
          zIndex: props.raised ? 20 : 0,
          onLoaded: (e: EventData) => {
            registry.zones.set(props.column, e.object as View)
            registry.revision.value++
          },
          onUnloaded: leave,
        }),
        slots.default?.(),
      )
  },
})
const Drag = defineComponent({
  inheritAttrs: false,
  props: kanbanDragProps,
  setup(props, { attrs, slots }) {
    const registry = inject(kanbanRegistryKey)! as KanbanRegistry<View>,
      surface = markRaw(createMotionSurface())
    let view: View | undefined,
      source: View | undefined,
      grip: View | undefined,
      zones: DropZones | undefined,
      live = false,
      queued = false,
      disposed = false
    function settle() {
      live = false
      Application.off(Application.suspendEvent, cancel)
      if (view) view.style.zIndex = 0
    }
    // Jolt can end a drag on its own (a cancelled touch, a source that went out of sight) and
    // leaves the card where it was; once the touch is over the board brings it back.
    const touched = (e: TouchGestureEventData) => {
      if (e.action !== 'up' && e.action !== 'cancel') return
      setTimeout(() => {
        if (live && !zones?.dragging) cancel()
      })
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
    function attach() {
      if (live) return
      release()
      if (props.disabled || !source?.isLoaded || !grip?.isLoaded) return
      const targets = registry.targets(props.cardId).filter(({ target }) => target.isLoaded)
      if (!targets.length) return
      unclip(
        source,
        targets.map(({ target }) => target),
      )
      zones = dropZones(source, {
        targets,
        drag: { handle: grip, snap: [0] },
        onMove({ id, bounds }) {
          if (!live) {
            if (!registry.begin(props.cardId, cancel)) {
              zones?.cancel()
              return
            }
            live = true
            Application.on(Application.suspendEvent, cancel)
            if (view) view.style.zIndex = 20
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
          else
            void Promise.resolve().then(() => {
              zones?.cancel()
              rest(false)
            })
        },
      })
    }
    // Views load parent first, so the columns and the card's own views arrive over one tick.
    function schedule() {
      if (queued || disposed) return
      queued = true
      void nextTick(() => {
        queued = false
        if (!disposed) attach()
      })
    }
    function unload() {
      cancel()
      release()
    }
    onBeforeUnmount(() => {
      disposed = true
      unload()
      registry.cards.delete(props.cardId)
      registry.focus.delete(props.cardId)
    })
    onDeactivated(cancel)
    onScopeDispose(surface.use(() => cancel))
    watch(() => [registry.revision.value, props.disabled], schedule)
    // A plain GridLayout would take the column's whole height on iOS; a box keeps the card's own.
    return () =>
      h(
        MBox,
        mergeProps(attrs, {
          onLoaded: (e: EventData) => {
            view = e.object as View
            registry.cards.set(props.cardId, () => rect(view))
            registry.focus.set(props.cardId, () => {
              if (view) notifyAccessibilityLayout(view)
            })
          },
          onUnloaded: () => {
            unload()
            view = undefined
            registry.cards.delete(props.cardId)
            registry.focus.delete(props.cardId)
          },
        }),
        () =>
          h(
            MBox,
            {
              motionSurface: surface,
              onLoaded: (e: EventData) => {
                source = e.object as View
                schedule()
              },
              onUnloaded: () => {
                unload()
                source = undefined
              },
            },
            () =>
              h(MColumn, { gap: 'xs' }, () => [
                h(
                  MBox,
                  {
                    height: 36,
                    accessibilityHidden: true,
                    accessibilityLabel: props.label,
                    opacity: props.disabled ? 0.4 : 0.65,
                    onTouch: touched,
                    onLoaded: (e: EventData) => {
                      grip = e.object as View
                      schedule()
                    },
                    onUnloaded: () => {
                      unload()
                      grip = undefined
                    },
                  },
                  () => h(MText, { text: '⠿', textAlignment: 'center' }),
                ),
                ...(slots.default?.() ?? []),
              ]),
          ),
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
