import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'
import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  shallowRef,
  watch,
} from 'nativescript-vue'
import { filePickerProps, fileStatusText, useButtonAction } from '@getcortexlabs/mavis-core/vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'
import { createNativeFilePicker } from '../../native/file-picker'
import { MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MProgress } from './MProgress.js'
import { MCard } from './MCard.js'
import { Application, isAndroid, type EventData, type View } from '@nativescript/core'

const FilePicker = defineComponent({
  name: 'MFilePicker',
  inheritAttrs: false,
  props: filePickerProps,
  setup(props, { attrs, expose }) {
    useButtonAction()
    const state = shallowRef(props.selection.state)
    const layout = useComponentLayout(() => state.value.items.map((item) => item.id))
    const picker = createNativeFilePicker()
    let chooseView: View | undefined
    let loaded = false
    let unsubscribe = () => {}
    watch(
      () => props.selection,
      (selection, previous) => {
        previous?.pause()
        unsubscribe()
        state.value = selection.state
        unsubscribe = selection.subscribe((value) => {
          state.value = value
        })
      },
      { immediate: true, flush: 'sync' },
    )
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) props.selection.pause()
      },
    )
    function unload() {
      loaded = false
      // Android stops/unloads the owner Activity when its system document picker opens.
      // Keep that intentional handoff alive; route unloads and component disposal still cancel.
      if (isAndroid && Application.android.paused && props.selection.state.picking) {
        for (const item of props.selection.state.items) props.selection.cancel(item.id)
      } else props.selection.pause()
      chooseView = undefined
    }
    onDeactivated(() => props.selection.pause())
    onBeforeUnmount(() => {
      unsubscribe()
      props.selection.pause()
      unload()
    })
    function focusChoose() {
      if (loaded && !props.disabled && !state.value.picking) chooseView?.focus()
    }
    expose({
      focus: focusChoose,
      blur: () => {
        chooseView?.android?.clearFocus()
        chooseView?.ios?.resignFirstResponder()
      },
    } satisfies InputHandle)
    function choose() {
      if (!loaded || props.disabled || state.value.picking) return
      const selection = props.selection
      void selection.select(picker).finally(async () => {
        await nextTick()
        if (props.selection === selection) focusChoose()
      })
    }
    return () => {
      if (!props.label.trim()) throw new TypeError('FilePicker needs a non-empty label')
      const selection = props.selection
      return h(
        MColumn,
        mergeProps(attrs, {
          gap: 'md',
          motionRegion: layout,
          onLoaded: () => {
            loaded = true
          },
          onUnloaded: unload,
        }),
        {
          default: () => [
            h(MText, { text: props.label, weight: '600' }),
            h(
              MRow,
              { gap: 'sm', wrap: true },
              {
                default: () => [
                  h(MButton, {
                    text: props.chooseLabel,
                    variant: 'secondary',
                    disabled: props.disabled || state.value.picking,
                    accessibilityLabel: `${props.chooseLabel}: ${props.label}`,
                    onClick: choose,
                    onLoaded: (event: EventData) => {
                      chooseView = event.object as View
                    },
                  }),
                  state.value.picking
                    ? h(MButton, {
                        text: props.cancelLabel,
                        variant: 'ghost',
                        onClick: () => {
                          selection.cancelSelection()
                          focusChoose()
                        },
                      })
                    : null,
                ],
              },
            ),
            state.value.error
              ? h(MText, {
                  text: props.errorLabels[state.value.error.code] ?? state.value.error.message,
                  tone: 'danger',
                })
              : null,
            !state.value.items.length ? h(MText, { text: props.emptyLabel, tone: 'muted' }) : null,
            ...state.value.items.map((item) => {
              const preview = selection.preview(item.id)
              const status = fileStatusText(item, props.statusLabels)
              return h(
                MCard,
                { key: item.id, gap: 'sm' },
                {
                  default: () => [
                    preview
                      ? h('Image', {
                          src: preview,
                          width: 80,
                          height: 80,
                          stretch: 'aspectFit',
                          horizontalAlignment: 'left',
                          accessible: false,
                          accessibilityHidden: true,
                        })
                      : null,
                    h(MText, { text: item.name, weight: '600' }),
                    h(MText, {
                      text: `${status}${item.size === undefined ? '' : ` · ${item.size} B`}`,
                      variant: 'caption',
                      tone:
                        item.status === 'failed'
                          ? 'danger'
                          : item.status === 'uploaded'
                            ? 'success'
                            : 'muted',
                    }),
                    item.status === 'uploading'
                      ? h(MProgress, {
                          value: (item.progress ?? 0) * 100,
                          indeterminate: item.progress === undefined,
                          label: `${props.uploadLabel}: ${item.name}`,
                          indeterminateLabel: props.pendingLabel,
                        })
                      : null,
                    item.error
                      ? h(MText, { text: item.error, tone: 'danger', variant: 'caption' })
                      : null,
                    h(
                      MRow,
                      { gap: 'sm', wrap: true },
                      {
                        default: () => [
                          item.status === 'uploading'
                            ? h(MButton, {
                                text: props.cancelLabel,
                                accessibilityLabel: `${props.cancelLabel}: ${item.name}`,
                                variant: 'secondary',
                                disabled: props.disabled,
                                onClick: () => selection.cancel(item.id),
                              })
                            : selection.canUpload && item.status !== 'uploaded'
                              ? h(MButton, {
                                  text:
                                    item.status === 'failed' || item.status === 'cancelled'
                                      ? props.retryLabel
                                      : props.uploadLabel,
                                  accessibilityLabel: `${item.status === 'failed' || item.status === 'cancelled' ? props.retryLabel : props.uploadLabel}: ${item.name}`,
                                  disabled: props.disabled || !selection.hasFile(item.id),
                                  onClick: () => {
                                    void selection.upload(item.id)
                                  },
                                })
                              : null,
                          h(MButton, {
                            text: props.removeLabel,
                            accessibilityLabel: `${props.removeLabel}: ${item.name}`,
                            variant: 'ghost',
                            disabled: props.disabled,
                            onClick: () => {
                              focusChoose()
                              selection.remove(item.id)
                            },
                          }),
                        ],
                      },
                    ),
                  ],
                },
              )
            }),
          ],
        },
      )
    }
  },
})

export const MFilePicker = FilePicker as typeof FilePicker & {
  new (): InstanceType<typeof FilePicker> & InputHandle
}
