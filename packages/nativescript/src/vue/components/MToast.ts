import { defineComponent, h, onBeforeUnmount, ref, watch, type PropType } from 'nativescript-vue'
import { Application, isIOS, Utils, type EventData, type View } from '@nativescript/core'
import { JoltTransition } from '@rafaelaugusto/jolt/vue'
import { toastProps, useMavisTheme, useToastHost } from '@getcortexlabs/mavis-core/vue'
import type { IconName, ToastTone } from '@getcortexlabs/mavis-core'
import { useLayerHost } from '../layers.js'
import { announceToast, toastReaderActive } from '../../native/toast'
import { observeCheckbox } from '../../native/checkbox'
import { MColumn, MBox } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'
import { MButton } from './MButton.js'

const icons: Record<ToastTone, IconName> = {
  success: 'circle-check',
  error: 'circle-alert',
  warning: 'triangle-alert',
  info: 'info',
}
const tones = { success: 'success', error: 'danger', warning: 'warning', info: 'accent' } as const

type Bridge = {
  host: ReturnType<typeof useToastHost>
  theme: ReturnType<typeof useMavisTheme>['theme']
  props: Readonly<{
    controller: import('@getcortexlabs/mavis-core').ToastController
    closeLabel: string
  }>
}
const ToastLayer = defineComponent({
  name: 'MToastLayer',
  props: { bridge: { type: Object as PropType<Bridge>, required: true }, covered: Boolean },
  setup(props) {
    const { host, theme } = props.bridge
    const width = ref(320)
    const height = ref(600)
    let enteredId: number | undefined
    let announcedId: number | undefined
    let root: View | undefined
    let parent: View | undefined
    let focus: ReturnType<typeof observeCheckbox> | undefined
    const size = () => {
      const bounds = parent?.getActualSize()
      if (bounds) {
        // The parent includes iOS safe areas even though Core lays this layer inside them.
        const insets = isIOS ? parent?.getSafeAreaInsets() : undefined
        const horizontal = insets
          ? Utils.layout.toDeviceIndependentPixels(insets.left + insets.right)
          : 0
        const vertical = insets
          ? Utils.layout.toDeviceIndependentPixels(insets.top + insets.bottom)
          : 0
        width.value = Math.max(0, Math.min(440, bounds.width - horizontal - 32))
        height.value = Math.max(48, bounds.height - vertical - 32)
      }
    }
    let background = false
    const suspend = () => {
      background = true
      host.pause('background', true)
    }
    const resume = () => {
      background = false
      if (root?.isLoaded) host.pause('background', false)
    }
    Application.on(Application.suspendEvent, suspend)
    Application.on(Application.resumeEvent, resume)
    function unload() {
      parent?.off('layoutChanged', size)
      focus?.dispose()
      focus = undefined
      root = parent = undefined
      // NativeScript also unloads the page when the app enters the background.
      if (!background) host.deactivate()
    }
    function announce() {
      const item = host.snapshot.value.message
      if (!root || props.covered || !item || item.id !== enteredId || item.id === announcedId)
        return
      announceToast(root, [item.title, item.message].filter(Boolean).join('. '))
      announcedId = item.id
    }
    watch(
      () => props.covered,
      (covered) => {
        host.pause('modal', covered)
        if (!covered) announce()
      },
      { immediate: true },
    )
    onBeforeUnmount(() => {
      unload()
      host.deactivate()
      Application.off(Application.suspendEvent, suspend)
      Application.off(Application.resumeEvent, resume)
    })
    return () => {
      const { colors, radius } = theme.value
      const { message, visible } = host.snapshot.value
      const tone = message ? tones[message.tone] : 'accent'
      return h(
        'MavisBox',
        {
          width: width.value,
          margin: 16,
          verticalAlignment: 'top',
          horizontalAlignment: 'center',
          visibility: props.covered || !message ? 'collapse' : 'visible',
          accessibilityHidden: props.covered || !message,
          onLoaded: (event: EventData) => {
            root = event.object as View
            parent = root.parent as View
            size()
            parent?.on('layoutChanged', size)
            host.pause('background', background)
            host.pause('modal', props.covered)
            host.activate()
          },
          onUnloaded: unload,
        },
        [
          h(
            JoltTransition,
            {
              appear: true,
              enter: [{ opacity: [0, 1], y: [-8, 0] }, { duration: 180 }],
              leave: [{ opacity: 0, y: -4 }, { duration: 120 }],
              onBeforeEnter: () => {
                if (message) host.begin(message.id)
              },
              onAfterEnter: () => {
                if (!message) return
                host.pause('reader', toastReaderActive())
                enteredId = message.id
                announce()
                host.entered(message.id)
              },
              onBeforeLeave: (element: { nativeView?: View }) => {
                if (element.nativeView) element.nativeView.accessibilityHidden = true
              },
              onAfterLeave: () => {
                if (message) host.left(message.id)
              },
            },
            {
              default: () =>
                message && visible
                  ? h(
                      'MavisBox',
                      {
                        key: message.id,
                        columns: '40,*,44',
                        padding: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                        backgroundColor: colors.surface,
                        style: isIOS ? { boxShadow: '0 6 18 0 rgba(26, 15, 25, 0.12)' } : undefined,
                      },
                      [
                        h(
                          MBox,
                          {
                            col: 0,
                            width: 40,
                            height: 40,
                            radius: 'full',
                            backgroundColor: colors.elevated,
                            verticalAlignment: 'top',
                          },
                          {
                            default: () =>
                              h(MIcon, {
                                name: icons[message.tone],
                                tone,
                                horizontalAlignment: 'center',
                                verticalAlignment: 'middle',
                              }),
                          },
                        ),
                        h(
                          'ScrollView',
                          {
                            col: 1,
                            marginLeft: 12,
                            style: { maxHeight: height.value - 34 },
                          },
                          [
                            h(
                              MColumn,
                              {
                                gap: 'xs',
                                verticalAlignment: 'top',
                              },
                              {
                                default: () => [
                                  message.title
                                    ? h(MText, {
                                        text: message.title,
                                        style: { fontWeight: '600' },
                                      })
                                    : null,
                                  h(MText, {
                                    text: message.message,
                                    tone: message.title ? 'muted' : 'text',
                                  }),
                                ],
                              },
                            ),
                          ],
                        ),
                        h(MButton, {
                          col: 2,
                          size: 'sm',
                          variant: 'ghost',
                          icon: 'x',
                          width: 44,
                          verticalAlignment: 'top',
                          accessibilityLabel: props.bridge.props.closeLabel,
                          style: { paddingLeft: 0, paddingRight: 0 },
                          onClick: () => props.bridge.props.controller.dismiss(message.id),
                          onLoaded: (event: EventData) => {
                            focus?.dispose()
                            focus = observeCheckbox(event.object as View, (value) =>
                              host.pause('focus', value),
                            )
                          },
                          onUnloaded: () => {
                            focus?.dispose()
                            focus = undefined
                            host.pause('focus', false)
                          },
                        }),
                      ],
                    )
                  : null,
            },
          ),
        ],
      )
    }
  },
})

export const MToast = defineComponent({
  name: 'MToast',
  inheritAttrs: false,
  props: toastProps,
  setup(props) {
    const layers = useLayerHost('MToast')
    const host = useToastHost(() => props.controller)
    const { theme } = useMavisTheme()
    onBeforeUnmount(
      layers.add({
        component: ToastLayer,
        props: { bridge: { host, theme, props } },
        presented: ref(true),
        modal: false,
      }),
    )
    return () => null
  },
})
