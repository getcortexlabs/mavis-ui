import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type PropType,
} from 'nativescript-vue'
import { Application, Utils, type EventData, type View } from '@nativescript/core'
import { JoltTransition } from '@rafaelaugusto/jolt/vue'
import { checkDialogLabels } from '@getcortexlabs/mavis-core'
import {
  dialogProps,
  dialogEmits,
  useDialogState,
  useMavisTheme,
} from '@getcortexlabs/mavis-core/vue'
import { useLayerHost } from '../layers.js'
import { systemBackKey } from '../system-back.js'
import { nativeViewOf } from '../native-view.js'
import { watchBack, setModal, safeAreaOf, contentInsets } from '../../native/sheet'
import { bindDialogFocus } from '../../native/dialog'
import { MBox, MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MIcon } from './MIcon.js'

type Bridge = {
  props: Readonly<import('nativescript-vue').ExtractPropTypes<typeof dialogProps>>
  state: ReturnType<typeof useDialogState>
  theme: ReturnType<typeof useMavisTheme>['theme']
}
type Element = { nativeView: View }
const DialogLayer = defineComponent({
  name: 'MDialogLayer',
  props: { bridge: { type: Object as PropType<Bridge>, required: true } },
  setup({ bridge }) {
    const { props, state, theme } = bridge
    const claim = inject(systemBackKey, undefined)
    const panel = shallowRef<Element>(),
      title = shallowRef<View>()
    const cancel = shallowRef<View>(),
      confirm = shallowRef<View>()
    const width = ref(320),
      available = ref(600),
      footerHeight = ref(56)
    const padding = ref({ top: 24, right: 24, bottom: 24, left: 24 })
    let host: View | undefined
    let focus: ReturnType<typeof bindDialogFocus> | undefined
    let releaseBack = () => {},
      releaseClaim = () => {}
    function size() {
      if (!host) return
      const area = safeAreaOf(host),
        insets = contentInsets(host)
      const bounds = host.getActualSize()
      padding.value = {
        top: area.top + 24,
        right: insets.right + 24,
        bottom: insets.bottom + 24,
        left: insets.left + 24,
      }
      width.value = Math.max(0, Math.min(440, bounds.width - insets.left - insets.right - 48))
      available.value = Math.max(170, bounds.height - area.top - insets.bottom - 48)
    }
    function release() {
      host?.off('layoutChanged', size)
      host = undefined
      releaseBack()
      releaseClaim()
      releaseBack = releaseClaim = () => {}
      focus?.dispose(Boolean(nativeViewOf(panel.value)?.page?.isLoaded && !Application.suspended))
      focus = undefined
    }
    function entered() {
      const views = {
        panel: nativeViewOf(panel.value),
        title: title.value,
        cancel: cancel.value,
        confirm: confirm.value,
      }
      if (!views.panel || !views.title || !views.cancel || !views.confirm) return
      setModal(views.panel, true)
      focus?.dispose(false)
      focus = bindDialogFocus(
        views as { panel: View; title: View; cancel: View; confirm: View },
        () => state.request('escape'),
      )
      focus.update(props.loading)
    }
    watch(
      () => props.loading,
      (loading) => focus?.update(loading),
      { flush: 'post' },
    )
    onBeforeUnmount(release)
    return () => {
      const { colors, radius } = theme.value
      const danger = props.tone === 'danger'
      const footerMax = Math.max(48, available.value - 122)
      const bodyMax = Math.max(48, available.value - Math.min(footerHeight.value, footerMax) - 74)
      return h(
        JoltTransition,
        {
          appear: true,
          enter: [{ opacity: [0, 1] }, { duration: 180 }],
          leave: [{ opacity: 0 }, { duration: 120 }],
          onAfterEnter: entered,
          onAfterLeave: state.left,
        },
        {
          default: () =>
            state.visible.value
              ? h(
                  'GridLayout',
                  {
                    iosIgnoreSafeArea: true,
                    onLoaded: (event: EventData) => {
                      host = (event.object as View).parent as View
                      size()
                      host.on('layoutChanged', size)
                      releaseBack = watchBack((event) => {
                        event.cancel = true
                        state.request('back')
                      })
                      releaseClaim =
                        claim?.({
                          owns: () => state.presented.value,
                          back: () => state.request('back'),
                        }) ?? (() => {})
                    },
                    onUnloaded: release,
                  },
                  [
                    h('MavisBox', {
                      backgroundColor: 'rgba(16, 11, 28, 0.5)',
                      accessible: false,
                      accessibilityHidden: true,
                      onTap: () => state.request('backdrop'),
                    }),
                    h(
                      'MavisBox',
                      {
                        ref: panel,
                        id: props.id,
                        rows: 'auto,auto',
                        marginTop: padding.value.top,
                        marginRight: padding.value.right,
                        marginBottom: padding.value.bottom,
                        marginLeft: padding.value.left,
                        width: width.value,
                        padding: 24,
                        horizontalAlignment: 'center',
                        verticalAlignment: 'middle',
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                        backgroundColor: colors.surface,
                      },
                      [
                        h('ScrollView', { row: 0, style: { maxHeight: bodyMax } }, [
                          h(
                            MColumn,
                            { gap: 'md', verticalAlignment: 'top' },
                            {
                              default: () => [
                                h(
                                  MBox,
                                  {
                                    width: 48,
                                    height: 48,
                                    radius: 'md',
                                    style: { alignSelf: 'flex-start' },
                                    backgroundColor: danger ? colors.elevated : colors.primarySoft,
                                  },
                                  {
                                    default: () =>
                                      h(MIcon, {
                                        name: danger ? 'triangle-alert' : 'circle-check',
                                        tone: danger ? 'danger' : 'primary',
                                        size: 'lg',
                                        horizontalAlignment: 'center',
                                        verticalAlignment: 'middle',
                                      }),
                                  },
                                ),
                                h(MText, {
                                  as: 'h2',
                                  variant: 'heading',
                                  text: props.title,
                                  onLoaded: (event: EventData) => {
                                    title.value = event.object as View
                                  },
                                }),
                                props.description
                                  ? h(MText, { text: props.description, tone: 'muted' })
                                  : null,
                              ],
                            },
                          ),
                        ]),
                        h(
                          'ScrollView',
                          { row: 1, marginTop: 24, style: { maxHeight: footerMax } },
                          [
                            h(
                              MRow,
                              {
                                gap: 'sm',
                                align: 'stretch',
                                verticalAlignment: 'top',
                                onLayoutChanged: (event: EventData) => {
                                  footerHeight.value = (event.object as View).getActualSize().height
                                },
                              },
                              {
                                default: () => [
                                  h(MButton, {
                                    onLoaded: (event: EventData) => {
                                      cancel.value = event.object as View
                                    },
                                    text: props.cancelLabel,
                                    variant: 'secondary',
                                    grow: 1,
                                    disabled: props.loading,
                                    style: { width: 0 },
                                    onClick: () => state.request('cancel'),
                                  }),
                                  h(MButton, {
                                    onLoaded: (event: EventData) => {
                                      confirm.value = event.object as View
                                    },
                                    text: props.confirmLabel,
                                    loading: props.loading,
                                    loadingText: props.loadingLabel,
                                    grow: 1,
                                    style: {
                                      width: 0,
                                      ...(danger
                                        ? { backgroundColor: colors.danger, color: colors.surface }
                                        : {}),
                                    },
                                    onClick: state.confirm,
                                  }),
                                ],
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                )
              : null,
        },
      )
    }
  },
})

export const MDialog = defineComponent({
  name: 'MDialog',
  inheritAttrs: false,
  props: dialogProps,
  emits: dialogEmits,
  setup(props, { emit }) {
    const layers = useLayerHost('MDialog')
    const state = useDialogState(props, emit)
    const { theme } = useMavisTheme()
    const active = ref(false)
    const bridge: Bridge = { props, state, theme }
    watch(
      () => props.open,
      (open) => {
        if (open && active.value) Utils.dismissKeyboard()
      },
    )
    onBeforeUnmount(
      layers.add({
        component: DialogLayer,
        props: { bridge },
        presented: computed(() => active.value && state.presented.value),
      }),
    )
    return () => {
      checkDialogLabels(props.title, props.confirmLabel, props.cancelLabel, props.loadingLabel)
      // The anchor observes a retained page even when its dialog is closed.
      return h('MavisBox', {
        visibility: 'collapse',
        accessibilityHidden: true,
        height: 0,
        onLoaded: () => {
          active.value = true
          if (props.open) Utils.dismissKeyboard()
        },
        onUnloaded: () => {
          if (!Application.suspended) state.request('navigation')
          active.value = false
        },
      })
    }
  },
})
