import { defineComponent, h, onBeforeUnmount, onDeactivated, Transition, useId, watch } from 'vue'
import {
  useButtonAction,
  dialogProps,
  dialogEmits,
  useDialogState,
  useMavisTheme,
  useCachedActivity,
} from '@getcortexlabs/mavis-core/vue'
import { checkDialogLabels, fontFamily } from '@getcortexlabs/mavis-core'
import { MButton } from './MButton.js'
import { MIcon } from './MIcon.js'

export const MDialog = defineComponent({
  name: 'MDialog',
  inheritAttrs: false,
  props: dialogProps,
  emits: dialogEmits,
  setup(props, { emit }) {
    useButtonAction()
    const active = useCachedActivity()
    const state = useDialogState(
      {
        get open() {
          return active.value && props.open
        },
        get loading() {
          return props.loading
        },
        get dismissible() {
          return props.dismissible
        },
      },
      emit,
    )
    const { theme } = useMavisTheme()
    const titleId = `m-dialog-${useId()}`
    let current: HTMLDialogElement | undefined
    let opener: HTMLElement | undefined
    let overflow: string | undefined
    let outside = false
    function release(element: HTMLDialogElement) {
      if (element.open) element.close()
      if (current !== element || props.open) return
      current = undefined
      if (overflow !== undefined && document.body.style.overflow === 'hidden')
        document.body.style.overflow = overflow
      overflow = undefined
      if (opener?.isConnected) opener.focus({ preventScroll: true })
      opener = undefined
    }
    function enter(element: Element) {
      const dialog = element as HTMLDialogElement
      if (current !== dialog) {
        opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
        overflow ??= document.body.style.overflow
      }
      current = dialog
      document.body.style.overflow = 'hidden'
      if (!dialog.open) dialog.showModal()
      const cancel = dialog.querySelector<HTMLButtonElement>('[data-dialog-cancel]')
      const panel = dialog.querySelector<HTMLElement>('.m-dialog-panel')
      ;(cancel && !cancel.disabled ? cancel : panel)?.focus({ preventScroll: true })
    }
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !current) return
      const controls = [...current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      const first = controls[0],
        last = controls[controls.length - 1]
      if (!first) {
        event.preventDefault()
        current.querySelector<HTMLElement>('.m-dialog-panel')?.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          !controls.includes(document.activeElement as HTMLButtonElement))
      ) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    watch(
      () => props.loading,
      (loading) => {
        if (loading)
          current?.querySelector<HTMLElement>('.m-dialog-panel')?.focus({ preventScroll: true })
      },
    )
    const cleanup = () => {
      if (current?.open) current.close()
      if (overflow !== undefined && document.body.style.overflow === 'hidden')
        document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
      current = opener = undefined
    }
    onBeforeUnmount(cleanup)
    onDeactivated(() => {
      state.request('navigation')
      cleanup()
    })
    return () => {
      checkDialogLabels(props.title, props.confirmLabel, props.cancelLabel, props.loadingLabel)
      const { colors, radius, typography } = theme.value
      const danger = props.tone === 'danger'
      return h(
        Transition,
        {
          name: 'm-dialog',
          appear: true,
          onEnter: enter,
          onAfterLeave: (element: Element) => {
            release(element as HTMLDialogElement)
            state.left()
          },
        },
        {
          default: () =>
            state.visible.value
              ? h(
                  'dialog',
                  {
                    id: props.id,
                    class: 'm-dialog',
                    'aria-labelledby': titleId,
                    'aria-describedby': props.description ? `${titleId}-description` : undefined,
                    'aria-busy': props.loading ? 'true' : undefined,
                    style: {
                      color: colors.text,
                      colorScheme: theme.value.appearance,
                      '--m-focus': colors.primary,
                    },
                    onCancel: (event: Event) => {
                      event.preventDefault()
                      state.request('escape')
                    },
                    onClose: (event: Event) => {
                      const element = event.target as HTMLDialogElement
                      if (element === current && !element.open && props.open)
                        state.request('escape')
                    },
                    onKeydown: trap,
                    onPointerdown: (event: Event) => {
                      outside = event.target === event.currentTarget
                    },
                    onClick: (event: Event) => {
                      if (outside && event.target === event.currentTarget) state.request('backdrop')
                      outside = false
                    },
                  },
                  [
                    h(
                      'div',
                      {
                        class: 'm-dialog-panel',
                        tabindex: -1,
                        style: {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderRadius: `${radius.lg}px`,
                          fontFamily: fontFamily(typography.body.fontFamily, 'web'),
                          fontSize: `${typography.body.fontSize}px`,
                        },
                      },
                      [
                        h('div', { class: 'm-dialog-body' }, [
                          h(
                            'div',
                            {
                              class: 'm-dialog-symbol',
                              style: {
                                backgroundColor: danger ? colors.elevated : colors.primarySoft,
                              },
                            },
                            [
                              h(MIcon, {
                                name: danger ? 'triangle-alert' : 'circle-check',
                                tone: danger ? 'danger' : 'primary',
                                size: 'lg',
                              }),
                            ],
                          ),
                          h(
                            'h2',
                            {
                              id: titleId,
                              class: 'm-dialog-title',
                              style: {
                                fontFamily: fontFamily(typography.heading.fontFamily, 'web'),
                                fontSize: `${typography.heading.fontSize}px`,
                                fontWeight: typography.heading.fontWeight,
                                lineHeight: typography.heading.lineHeight,
                              },
                            },
                            props.title,
                          ),
                          props.description
                            ? h(
                                'p',
                                {
                                  id: `${titleId}-description`,
                                  class: 'm-dialog-description',
                                  style: {
                                    color: colors.muted,
                                    lineHeight: typography.body.lineHeight,
                                  },
                                },
                                props.description,
                              )
                            : null,
                        ]),
                        h('div', { class: 'm-dialog-actions' }, [
                          h(MButton, {
                            'data-dialog-cancel': '',
                            grow: 1,
                            text: props.cancelLabel,
                            variant: 'secondary',
                            disabled: props.loading,
                            onClick: () => state.request('cancel'),
                          }),
                          h(MButton, {
                            'data-dialog-confirm': '',
                            grow: 1,
                            text: props.confirmLabel,
                            loading: props.loading,
                            disabled: props.loading,
                            loadingText: props.loadingLabel,
                            style: danger
                              ? { backgroundColor: colors.danger, color: colors.surface }
                              : undefined,
                            onClick: state.confirm,
                          }),
                        ]),
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
