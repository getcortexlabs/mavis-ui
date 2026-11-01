import {
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  registerElement,
  shallowRef,
  watch,
  type ExtractPropTypes,
  type PropType,
  type Ref,
  type VNodeChild,
} from 'nativescript-vue'
import { bottomSheet, GestureSurface, type BottomSheet } from '@rafaelaugusto/jolt/bottom-sheet'
import { sheetProps, sheetEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { checkSheetName, type SheetCloseReason } from '@getcortexlabs/mavis-core'
import { isAndroid, type EventData, type ScrollView, type View } from '@nativescript/core'
import { MRow, MColumn, MBox } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { useLayerHost } from '../layers.js'
import { nativeViewOf } from '../native-view.js'
import { systemBackKey } from '../system-back.js'
import { watchBack, setModal, safeAreaOf, contentInsets } from '../../native/sheet'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'

registerElement('MavisSheetPanel', () => GestureSurface, { viewFlags: 4 })

type SheetState = ExtractPropTypes<typeof sheetProps>
type Element<T extends View = View> = { nativeView: T }

interface Bridge {
  state: SheetState
  content: () => VNodeChild
  provides: Record<PropertyKey, unknown>
  presented: Ref<boolean>
  requestClose(reason: SheetCloseReason): void
  dismissed(reason: SheetCloseReason): void
  reopened(): void
  settled(): void
}

/** Content rendered by the Screen still resolves injections from the sheet's own position. */
function bridgeProvides(source: Record<PropertyKey, unknown>) {
  const seen = new Set<PropertyKey>()
  for (
    let chain: object | null = source;
    chain && chain !== Object.prototype;
    chain = Object.getPrototypeOf(chain)
  ) {
    for (const key of [
      ...Object.getOwnPropertyNames(chain),
      ...Object.getOwnPropertySymbols(chain),
    ]) {
      if (seen.has(key)) continue
      seen.add(key)
      provide(key as string | symbol, (chain as Record<PropertyKey, unknown>)[key])
    }
  }
}

function focusAccessibility(view: View | undefined) {
  if (!view?.isLoaded) return
  if (isAndroid) view.android.performAccessibilityAction(64, null)
  else notifyAccessibilityLayout(view)
}

const SheetLayer = defineComponent({
  name: 'MSheetLayer',
  props: { bridge: { type: Object as PropType<Bridge>, required: true } },
  setup(props) {
    const bridge = props.bridge
    bridgeProvides(bridge.provides)
    const { theme } = useMavisTheme()
    const claimSystemBack = inject(systemBackKey, undefined)
    const panel = shallowRef<Element<GestureSurface>>()
    const handle = shallowRef<Element>()
    const scroll = shallowRef<Element<ScrollView>>()
    const backdrop = shallowRef<Element>()
    // The surface covers the window edges; content clears the home indicator and landscape notch.
    const insets = ref({ left: 0, right: 0, bottom: 0 })
    let title: View | undefined
    let sheet: BottomSheet | undefined
    let pending: SheetCloseReason | undefined
    let requested = false
    let releaseBack = () => {}
    let releaseClaim = () => {}

    function updateInsets() {
      const host = nativeViewOf(panel.value)?.parent as View | undefined
      if (!host) return
      const next = contentInsets(host)
      const current = insets.value
      if (
        next.left !== current.left ||
        next.right !== current.right ||
        next.bottom !== current.bottom
      )
        insets.value = next
    }

    function dispose() {
      releaseBack()
      releaseClaim()
      releaseBack = releaseClaim = () => {}
      const current = sheet
      sheet = undefined
      current?.dispose()
    }
    function present() {
      const views = {
        panel: nativeViewOf(panel.value),
        handle: nativeViewOf(handle.value),
        scroll: nativeViewOf(scroll.value),
        backdrop: nativeViewOf(backdrop.value),
      }
      if (sheet || !views.panel || !views.handle || !views.scroll || !views.backdrop) return
      const state = bridge.state
      const host = views.panel.parent as View
      updateInsets()
      pending = undefined
      requested = false
      const back = () => {
        if (!sheet?.isOpen) return
        if (!state.dismissible) return
        pending = 'back'
        sheet.dismiss()
      }
      // Core's own navigation honors the cancelled event; a router that owns back asks the claimant first.
      releaseBack = watchBack((event) => {
        if (sheet?.isOpen) event.cancel = true
        back()
      })
      releaseClaim = claimSystemBack?.({ owns: () => Boolean(sheet?.isOpen), back }) ?? (() => {})
      setModal(views.panel, true)
      let opened = false
      sheet = bottomSheet(views.panel, {
        handle: views.handle,
        scrollView: views.scroll,
        backdrop: views.backdrop,
        safeArea: safeAreaOf(host),
        snap: [state.fullscreen ? '100%' : 'content'],
        dismissible: state.dismissible,
        accessibility: {
          label: state.title ?? state.accessibilityLabel,
          dismiss: state.closeLabel,
        },
        onChange(point) {
          if (point === null) {
            if (!requested) bridge.dismissed(pending ?? 'swipe')
            pending = undefined
            opened = false
            return
          }
          requested = false
          bridge.reopened()
          if (!opened) focusAccessibility(title)
          opened = true
        },
        onDismiss: () => bridge.settled(),
      })
      sheet.open()
    }

    onMounted(() => {
      if (bridge.presented.value) present()
    })
    watch(
      () => bridge.presented.value,
      (presented) => {
        if (presented) present()
      },
      { flush: 'post' },
    )
    watch(
      () => bridge.presented.value,
      (presented) => {
        if (!presented) dispose()
      },
    )
    watch(
      () => bridge.state.open,
      (open) => {
        if (!open && sheet) {
          requested = true
          sheet.dismiss()
        }
      },
    )
    onBeforeUnmount(dispose)

    return () => {
      if (!bridge.presented.value) return null
      const state = bridge.state
      const { colors, radius } = theme.value
      const header =
        state.title || state.dismissible
          ? h(
              MRow,
              { row: 1, paddingX: 'lg', paddingY: 'sm', gap: 'sm', justify: 'between' },
              {
                default: () => [
                  state.title
                    ? h(MText, {
                        as: 'h2',
                        variant: 'heading',
                        grow: 1,
                        text: state.title,
                        onLoaded: (event: EventData) => {
                          title = event.object as View
                        },
                      })
                    : h(MBox, { grow: 1 }),
                  state.dismissible
                    ? h(MButton, {
                        variant: 'ghost',
                        size: 'sm',
                        icon: 'x',
                        shrink: 0,
                        accessibilityLabel: state.closeLabel,
                        onClick: () => bridge.requestClose('button'),
                      })
                    : null,
                ],
              },
            )
          : null
      return [
        h('MavisBox', {
          ref: backdrop,
          backgroundColor: '#000000',
          accessible: false,
          accessibilityHidden: true,
          onTap: () => {
            if (state.dismissible) pending = 'backdrop'
          },
        }),
        h(
          'MavisSheetPanel',
          {
            ref: panel,
            id: state.id,
            onLayoutChanged: updateInsets,
            style: {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              paddingLeft: insets.value.left,
              paddingRight: insets.value.right,
              paddingBottom: insets.value.bottom,
            },
          },
          [
            h('GridLayout', { rows: 'auto,auto,*' }, [
              h('GridLayout', { ref: handle, row: 0, height: 24 }, [
                h('MavisBox', {
                  width: 36,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: colors.border,
                  horizontalAlignment: 'center',
                  verticalAlignment: 'middle',
                }),
              ]),
              header,
              // Reserve the handle/header before measuring the viewport. A flex child's
              // initial measurement can otherwise retain the full panel height on Android.
              h('ScrollView', { ref: scroll, row: 2 }, [
                h(
                  MColumn,
                  { padding: state.padding, gap: state.gap, align: state.align },
                  { default: () => bridge.content() },
                ),
              ]),
            ]),
          ],
        ),
      ]
    }
  },
})

export const MSheet = defineComponent({
  name: 'MSheet',
  inheritAttrs: false,
  props: sheetProps,
  emits: sheetEmits,
  setup(props, { slots, emit }) {
    const host = useLayerHost('MSheet')
    checkSheetName(props.title, props.accessibilityLabel)
    // Vue keeps the injection chain on the instance without declaring it in its public types.
    const provides =
      (getCurrentInstance() as { provides?: Record<PropertyKey, unknown> } | null)?.provides ?? {}
    const presented = ref(false)
    let closing: SheetCloseReason | undefined
    const announce = (reason: SheetCloseReason) => {
      closing = reason
      emit('update:open', false)
      emit('close', reason)
    }
    const bridge: Bridge = {
      state: props,
      content: () => slots.default?.(),
      provides,
      presented,
      requestClose(reason) {
        if (props.open && !closing) announce(reason)
      },
      dismissed(reason) {
        if (!closing) announce(reason)
      },
      reopened() {
        closing = undefined
        if (!props.open) emit('update:open', true)
      },
      settled() {
        presented.value = false
        closing = undefined
      },
    }
    watch(
      () => props.open,
      (open) => {
        if (open) {
          closing = undefined
          presented.value = true
        } else if (presented.value && !closing) {
          closing = 'program'
          emit('close', 'program')
        }
      },
      { immediate: true },
    )
    onBeforeUnmount(host.add({ component: SheetLayer, props: { bridge }, presented }))
    return () => {
      // An unnamed sheet fails where it is declared, not in the Screen's render.
      checkSheetName(props.title, props.accessibilityLabel)
      return null
    }
  },
})
