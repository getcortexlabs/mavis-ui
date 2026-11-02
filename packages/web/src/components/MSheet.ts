import {
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onActivated,
  onMounted,
  provide,
  ref,
  useId,
  watch,
} from 'vue'
import {
  useButtonAction,
  sheetProps,
  sheetEmits,
  useMavisTheme,
  useCachedActivity,
  layoutDirection,
} from '@getcortexlabs/mavis-core/vue'
import {
  checkSheetName,
  resolveSpace,
  type SheetName,
  type SheetCloseReason,
} from '@getcortexlabs/mavis-core'
import { MRow, MColumn, MBox } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'

import { sheetMotion } from '../sheet-motion.js'

const Sheet = defineComponent({
  name: 'MSheet',
  inheritAttrs: false,
  props: sheetProps,
  emits: sheetEmits,
  setup(props, { slots, emit }) {
    useButtonAction()
    const { theme } = useMavisTheme()
    const active = useCachedActivity()
    provide(layoutDirection, 'column')
    const titleId = `m-sheet-${useId()}`
    const dialog = ref<HTMLDialogElement>()
    const panel = ref<HTMLElement>()
    const presented = ref(false)
    const shown = ref(false)
    let closing: SheetCloseReason | undefined
    let generation = 0
    let motion: ReturnType<typeof sheetMotion> | undefined
    const handle = ref<HTMLElement>()
    let outside = false
    let opener: HTMLElement | undefined

    const announce = (reason: SheetCloseReason) => {
      closing = reason
      emit('update:open', false)
      emit('close', reason)
    }
    const request = (reason: SheetCloseReason) => {
      if (!props.open || closing) return
      announce(reason)
      nextTick(() => {
        if (props.open && closing === reason) {
          closing = undefined
          motion?.show()
        }
      })
    }

    const focusable = (element: HTMLElement) =>
      [
        ...element.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((control) => !control.closest('[inert]'))
    // Engines differ on which control a modal dialog focuses first; start at the first control,
    // or the panel itself, unless the content asked for focus with `autofocus`.
    function focusInitial(element: HTMLDialogElement) {
      if (typeof document === 'undefined') return
      const active = document.activeElement
      if (active && active !== element && element.contains(active)) return
      const panel = element.querySelector<HTMLElement>('.m-sheet-panel')
      if (panel) panel.tabIndex = -1
      ;(focusable(element)[0] ?? panel)?.focus({ preventScroll: true })
    }
    // A modal dialog makes the page inert, yet Tab can still leave for the browser's own controls.
    function trapTab(event: KeyboardEvent) {
      const element = dialog.value
      if (event.key !== 'Tab' || !element) return
      const controls = focusable(element)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (!first || !last) return
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === element)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    // The dialog restores focus when it closes; some engines leave it on the body instead.
    function restoreFocus() {
      const target = opener
      opener = undefined
      const active = typeof document === 'undefined' ? null : document.activeElement
      if (target?.isConnected && (!active || active === document.body))
        target.focus({ preventScroll: true })
    }
    function present() {
      const current = ++generation
      presented.value = true
      if (
        !dialog.value?.open &&
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement
      )
        opener = document.activeElement
      nextTick(() => {
        const element = dialog.value
        if (generation !== current || !element) return
        if (typeof element.showModal === 'function' && !element.open) element.showModal()
        focusInitial(element)
        if (!motion)
          motion = sheetMotion(
            element,
            panel.value!,
            handle.value ?? null,
            () => props.dismissible,
            () => {
              if (props.open) return
              motion?.dispose()
              motion = undefined
              if (element.open) element.close()
              presented.value = false
              closing = undefined
              restoreFocus()
            },
            () => request('swipe'),
          )
        shown.value = true
        motion.show()
      })
    }
    function leave() {
      generation++
      shown.value = false
      if (motion) motion.hide()
      else {
        dialog.value?.close?.()
        presented.value = false
        closing = undefined
        restoreFocus()
      }
    }
    watch(
      () => props.dismissible,
      () => motion?.refresh(),
    )

    watch(
      () => props.open,
      (open) => {
        if (open && active.value) {
          closing = undefined
          present()
        } else if (presented.value) {
          if (!closing) {
            closing = 'program'
            emit('close', 'program')
          }
          leave()
        }
      },
    )
    onActivated(() => {
      if (props.open && !presented.value) present()
    })
    onMounted(() => {
      if (props.open) present()
    })
    onDeactivated(() => {
      generation++
      motion?.dispose()
      motion = undefined
      dialog.value?.close?.()
      shown.value = presented.value = false
      opener = undefined
      if (props.open) announce('program')
    })
    onBeforeUnmount(() => {
      generation++
      motion?.dispose()
      motion = undefined
      dialog.value?.close?.()
      restoreFocus()
    })

    return () => {
      const name = checkSheetName(props.title, props.accessibilityLabel)
      const title = props.title?.trim()
      const { colors, radius, space } = theme.value
      const header =
        title || props.dismissible
          ? h(
              MRow,
              { gap: 'sm', justify: 'between' },
              {
                default: () => [
                  title
                    ? h(MText, {
                        as: 'h2',
                        variant: 'heading',
                        grow: 1,
                        id: titleId,
                        text: title,
                      })
                    : h(MBox, { grow: 1 }),
                  props.dismissible
                    ? h(MButton, {
                        variant: 'ghost',
                        size: 'sm',
                        icon: 'x',
                        shrink: 0,
                        accessibilityLabel: props.closeLabel,
                        onClick: () => request('button'),
                      })
                    : null,
                ],
              },
            )
          : null
      return h(
        'dialog',
        {
          ref: dialog,
          id: props.id,
          class: ['m-sheet', { 'm-sheet-open': shown.value, 'm-sheet-full': props.fullscreen }],
          'aria-labelledby': title ? titleId : undefined,
          'aria-label': title ? undefined : name,
          style: {
            '--m-sheet-surface': colors.surface,
            '--m-sheet-radius': `${radius.lg}px`,
            '--m-focus': colors.primary,
            color: colors.text,
            colorScheme: theme.value.appearance,
          },
          onCancel: (event: Event) => {
            // Keep modal ownership until Jolt completes the departure.
            event.preventDefault()
            if (props.dismissible) request('escape')
          },
          onClose: () => {
            // close events are queued: a previous dismissal can arrive after a rapid reopen.
            if (dialog.value?.open) return
            // Closed by the browser itself: keep the bound state in step.
            if (props.open && !closing) announce('escape')
            motion?.dispose()
            motion = undefined
            shown.value = false
            presented.value = false
            restoreFocus()
          },
          onKeydown: trapTab,
          onPointerdown: (event: Event) => {
            outside = event.target === event.currentTarget
          },
          onClick: (event: Event) => {
            if (outside && event.target === event.currentTarget && props.dismissible)
              request('backdrop')
            outside = false
          },
        },
        presented.value
          ? [
              h(
                'div',
                {
                  class: 'm-sheet-panel',
                  ref: panel,
                  style: {
                    padding: `${resolveSpace(theme.value, props.padding ?? 'lg')}px`,
                    gap: `${space.md}px`,
                  },
                },
                [
                  h(
                    'div',
                    {
                      ref: handle,
                      class: 'm-sheet-handle',
                      'aria-hidden': 'true',
                      style: { display: props.dismissible ? undefined : 'none' },
                    },
                    [h('span')],
                  ),
                  header,
                  h(
                    MColumn,
                    { class: 'm-sheet-body', shrink: 1, gap: props.gap, align: props.align },
                    { default: () => slots.default?.() },
                  ),
                ],
              ),
            ]
          : undefined,
      )
    }
  },
})

export const MSheet = Sheet as typeof Sheet & {
  new (): InstanceType<typeof Sheet> & { $props: SheetName }
}
