import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'
import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { filePickerProps, fileStatusText, useButtonAction } from '@getcortexlabs/mavis-core/vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'
import { createWebFilePicker } from '../files.js'
import { MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MProgress } from './MProgress.js'
import { MCard } from './MCard.js'

const FilePicker = defineComponent({
  name: 'MFilePicker',
  inheritAttrs: false,
  props: filePickerProps,
  setup(props, { attrs, expose }) {
    useButtonAction()
    const root = ref<HTMLElement>()
    const state = shallowRef(props.selection.state)
    const layout = useComponentLayout(() => state.value.items.map((item) => item.id))
    const picker = createWebFilePicker()
    let mounted = false
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
    onMounted(() => {
      mounted = true
    })
    onDeactivated(() => props.selection.pause())
    onBeforeUnmount(() => {
      mounted = false
      unsubscribe()
      props.selection.pause()
    })
    function focusChoose() {
      if (!mounted || props.disabled || state.value.picking) return
      root.value
        ?.querySelector<HTMLButtonElement>('[data-file-choose]')
        ?.focus({ preventScroll: true })
    }
    expose({
      focus: focusChoose,
      blur: () => root.value?.querySelector<HTMLButtonElement>('[data-file-choose]')?.blur(),
    } satisfies InputHandle)
    function choose() {
      if (!mounted || props.disabled || state.value.picking) return
      focusChoose()
      const selection = props.selection
      void selection.select(picker).finally(async () => {
        await nextTick()
        if (mounted && props.selection === selection && !props.disabled) focusChoose()
      })
    }
    return () => {
      if (!props.label.trim()) throw new TypeError('FilePicker needs a non-empty label')
      const selection = props.selection
      return h(
        'div',
        mergeProps(attrs, {
          ref: root,
          role: 'group',
          'aria-label': props.label,
          style: { minWidth: 0 },
        }),
        [
          h(
            MColumn,
            { gap: 'md', motionRegion: layout },
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
                        'data-file-choose': '',
                        onClick: choose,
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
                  ? h('div', { role: 'alert' }, [
                      h(MText, {
                        text:
                          props.errorLabels[state.value.error.code] ?? state.value.error.message,
                        tone: 'danger',
                      }),
                    ])
                  : null,
                !state.value.items.length
                  ? h(MText, { text: props.emptyLabel, tone: 'muted' })
                  : null,
                ...state.value.items.map((item) => {
                  const preview = selection.preview(item.id)
                  const status = fileStatusText(item, props.statusLabels)
                  return h(
                    MCard,
                    { key: item.id, gap: 'sm' },
                    {
                      default: () => [
                        typeof preview === 'string'
                          ? h('img', {
                              src: preview,
                              alt: '',
                              width: 80,
                              height: 80,
                              style: { objectFit: 'contain', borderRadius: '8px' },
                              onError: () => selection.discardPreview(item.id),
                            })
                          : null,
                        h(MText, {
                          text: item.name,
                          weight: '600',
                          style: { overflowWrap: 'anywhere' },
                        }),
                        h(MText, {
                          text: `${status}${item.size === undefined ? '' : ` · ${item.size} B`}`,
                          variant: 'caption',
                          tone:
                            item.status === 'failed'
                              ? 'danger'
                              : item.status === 'uploaded'
                                ? 'success'
                                : 'muted',
                          'aria-live': 'polite',
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
          ),
        ],
      )
    }
  },
})

export const MFilePicker = FilePicker as typeof FilePicker & {
  new (): InstanceType<typeof FilePicker> & InputHandle
}
