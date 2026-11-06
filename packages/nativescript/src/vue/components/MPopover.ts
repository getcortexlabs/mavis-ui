import { animate } from '@rafaelaugusto/jolt'
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onBeforeUnmount,
  provide,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNodeChild,
} from 'nativescript-vue'
import { isAndroid, type EventData, type View } from '@nativescript/core'
import {
  placePopover,
  resolveSpace,
  componentMotion,
  type PopoverCloseReason,
} from '@getcortexlabs/mavis-core'
import { popoverProps, useCachedActivity, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useLayerHost } from '../layers.js'
import { systemBackKey } from '../system-back.js'
import { contentInsets, safeAreaOf, setModal, watchBack } from '../../native/sheet'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'
import { MButton } from './MButton.js'
import { MColumn } from './layout.js'

export const MPopover = defineComponent({
  name: 'MPopover',
  inheritAttrs: false,
  props: popoverProps,
  emits: {
    'update:open': (_open: boolean) => true,
    close: (_reason: PopoverCloseReason) => true,
    opened: () => true,
  },
  setup(props, { attrs, slots, emit }) {
    const host = useLayerHost('MPopover')
    const { theme } = useMavisTheme()
    const active = useCachedActivity()
    const requested = computed(() => props.open && !props.disabled && active.value)
    const presented = ref(requested.value)
    let presentation: View | undefined
    let playback: ReturnType<typeof animate> | undefined
    let revision = 0
    watch(requested, (open) => {
      const token = ++revision
      if (presentation) {
        presentation.accessibilityHidden = !open
        setModal(presentation, open)
      }
      if (open) {
        presented.value = true
        if (presentation)
          playback = animate(
            presentation,
            { opacity: 1, y: 0 },
            componentMotion(theme.value, 'overlay'),
          )
      } else if (presentation?.isLoaded && active.value) {
        playback = animate(
          presentation,
          { opacity: 0, y: 3 },
          { duration: theme.value.motion.exitDuration },
        )
        void playback.finished.then(() => {
          if (token === revision) presented.value = false
        })
      } else presented.value = false
    })
    const anchor = shallowRef<{ nativeView: View }>()
    const trigger = shallowRef<{ $el?: { nativeView?: View } }>()
    const provides =
      (getCurrentInstance() as { provides?: Record<PropertyKey, unknown> } | null)?.provides ?? {}
    const claimBack = inject(systemBackKey, undefined)
    let releaseBack = () => {}
    let releaseClaim = () => {}
    const scrollParents: View[] = []
    function close(reason: PopoverCloseReason) {
      if (!props.open) return
      emit('update:open', false)
      emit('close', reason)
    }
    let reposition: (() => void) | undefined
    const scrolled = () => {
      if (slots.anchor) reposition?.()
      else close('program')
    }
    function cleanup() {
      releaseBack()
      releaseClaim()
      releaseBack = releaseClaim = () => {}
      scrollParents.splice(0).forEach((view) => view.off('scroll', scrolled))
    }
    watch(
      requested,
      (value) => {
        cleanup()
        if (!value) {
          void nextTick(() => {
            if (active.value && !props.open) trigger.value?.$el?.nativeView?.focus()
          })
          return
        }
        const back = () => close('back')
        releaseBack = watchBack((event) => {
          event.cancel = true
          back()
        })
        releaseClaim = claimBack?.({ owns: () => requested.value, back }) ?? (() => {})
        for (
          let parent = anchor.value?.nativeView.parent as View | undefined;
          parent;
          parent = parent.parent as View | undefined
        ) {
          parent.on('scroll', scrolled)
          scrollParents.push(parent)
        }
      },
      { immediate: true },
    )
    watch(
      () => active.value && !props.disabled,
      (value) => {
        if (!value && props.open) close('program')
      },
    )
    const Layer = defineComponent({
      name: 'MPopoverLayer',
      props: { content: { type: Function as PropType<() => VNodeChild>, required: true } },
      setup(layer) {
        const seen = new Set<PropertyKey>()
        for (
          let source: object | null = provides;
          source && source !== Object.prototype;
          source = Object.getPrototypeOf(source)
        ) {
          for (const key of Reflect.ownKeys(source)) {
            if (seen.has(key)) continue
            seen.add(key)
            provide(key as string | symbol, (source as Record<PropertyKey, unknown>)[key])
          }
        }
        const root = shallowRef<View>()
        const panel = shallowRef<View>()
        const position = ref({ x: 8, y: 8, width: props.width, height: 400 })
        function place() {
          const container = root.value
          const target = anchor.value?.nativeView
          const surface = panel.value
          if (!container?.isLoaded || !target?.isLoaded || !surface) return
          const location = target.getLocationRelativeTo(container)
          if (!location) {
            close('program')
            return
          }
          const size = container.getActualSize()
          if (!size.width || !size.height) return
          const inset = contentInsets(container)
          const safe = safeAreaOf(container)
          const viewport = {
            x: inset.left,
            y: safe.top,
            width: size.width - inset.left - inset.right,
            height: size.height - safe.top - safe.bottom,
          }
          const width = Math.max(1, Math.min(props.width, viewport.width - 16))
          const height = Math.max(1, viewport.height - 16)
          const measured = surface.getActualSize()
          const rtl = isAndroid
            ? target.android?.getLayoutDirection?.() === 1
            : target.ios?.effectiveUserInterfaceLayoutDirection === 1
          const next = {
            ...placePopover(
              { ...location, ...target.getActualSize() },
              { width, height: Math.min(measured.height, height) },
              viewport,
              props.placement,
              rtl,
            ),
            width,
            height,
          }
          if (JSON.stringify(next) !== JSON.stringify(position.value)) position.value = next
        }
        reposition = place
        onBeforeUnmount(() => {
          if (reposition === place) reposition = undefined
        })
        watch(
          () => [props.width, props.placement],
          () => void nextTick(place),
        )
        return () =>
          h(
            'GridLayout',
            {
              onLoaded: (event: EventData) => {
                root.value = event.object as View
                place()
              },
              onLayoutChanged: place,
            },
            [
              h('MavisBox', {
                backgroundColor: 'transparent',
                accessible: false,
                onTap: () => close('outside'),
              }),
              h('AbsoluteLayout', { isPassThroughParentEnabled: true }, [
                h(
                  'ScrollView',
                  {
                    left: position.value.x,
                    top: position.value.y,
                    width: position.value.width,
                    maxHeight: position.value.height,
                    id: props.id,
                    isUserInteractionEnabled: requested.value,
                    accessibilityHidden: !requested.value,
                    accessibilityLabel: props.label,
                    backgroundColor: theme.value.colors.surface,
                    borderColor: theme.value.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.value.radius.md,
                    onLoaded: (event: EventData) => {
                      const view = event.object as View
                      panel.value = view
                      presentation = view
                      if (!requested.value) {
                        presented.value = false
                        return
                      }
                      playback = animate(
                        view,
                        { opacity: [0, 1], y: [6, 0] },
                        componentMotion(theme.value, 'overlay'),
                      )
                      setModal(view, true)
                      void nextTick(() => {
                        if (!view.isLoaded || !requested.value) return
                        place()
                        if (isAndroid) view.android?.performAccessibilityAction(64, null)
                        else notifyAccessibilityLayout(view)
                        emit('opened')
                      })
                    },
                    onLayoutChanged: place,
                    onUnloaded: () => {
                      if (panel.value) setModal(panel.value, false)
                      playback?.stop()
                      presentation = undefined
                      panel.value = undefined
                    },
                  },
                  [
                    h(
                      MColumn,
                      { padding: resolveSpace(theme.value, props.padding), gap: 'sm' },
                      () => layer.content(),
                    ),
                  ],
                ),
              ]),
            ],
          )
      },
    })
    const remove = host.add({
      component: Layer,
      props: { content: () => slots.default?.({ close: () => close('program') }) },
      presented,
    })
    onBeforeUnmount(() => {
      revision++
      playback?.stop()
      cleanup()
      remove()
    })
    return () => {
      if (!props.label.trim() || !props.triggerLabel.trim())
        throw new TypeError('Popovers require panel and trigger labels.')
      if (!Number.isFinite(props.width) || props.width <= 0)
        throw new RangeError('Popover width must be positive and finite.')
      return h(
        'GridLayout',
        {
          rows: 'auto',
          columns: 'auto',
          ...attrs,
          ref: anchor,
          horizontalAlignment: slots.anchor ? 'stretch' : 'left',
          verticalAlignment: 'top',
        },
        [
          slots.anchor?.() ??
            h(MButton, {
              ref: trigger,
              text: props.triggerLabel,
              icon: props.icon,
              variant: props.variant,
              disabled: props.disabled,
              accessibilityState: props.open ? 'expanded' : '',
              onClick: () => (props.open ? close('trigger') : emit('update:open', true)),
            }),
        ],
      )
    }
  },
})
