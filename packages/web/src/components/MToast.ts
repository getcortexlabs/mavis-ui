import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  Teleport,
  Transition,
  watch,
} from 'vue'
import { toastProps, useMavisTheme, useToastHost } from '@getcortexlabs/mavis-core/vue'
import type { IconName, ToastTone } from '@getcortexlabs/mavis-core'
import { MIcon } from './MIcon.js'

const icons: Record<ToastTone, IconName> = {
  success: 'circle-check',
  error: 'circle-alert',
  warning: 'triangle-alert',
  info: 'info',
}
const tones = { success: 'success', error: 'danger', warning: 'warning', info: 'accent' } as const

export const MToast = defineComponent({
  name: 'MToast',
  inheritAttrs: false,
  props: toastProps,
  setup(props) {
    const { theme } = useMavisTheme()
    const host = useToastHost(() => props.controller)
    const mounted = ref(false)
    const covered = ref(false)
    const top = ref(0)
    const announcement = ref('')
    let enteredId: number | undefined
    function announce() {
      const item = host.snapshot.value.message
      if (!covered.value && item && item.id === enteredId)
        announcement.value = [item.title, item.message].filter(Boolean).join('. ')
    }
    watch(covered, announce)
    let opener: HTMLElement | undefined
    let observer: MutationObserver | undefined
    let viewport: VisualViewport | null = null
    function updateVisibility() {
      host.pause('background', document.hidden)
    }
    function updateModal() {
      covered.value = Boolean(document.querySelector('dialog[open]'))
      host.pause('modal', covered.value)
    }
    function updateViewport() {
      top.value = viewport?.scale === 1 ? viewport.offsetTop : 0
    }
    function restoreFocus(element: Element) {
      if (element.contains(document.activeElement) && opener?.isConnected)
        opener.focus({ preventScroll: true })
    }
    onMounted(() => {
      if (typeof document === 'undefined') return
      mounted.value = true
      updateVisibility()
      updateModal()
      document.addEventListener('visibilitychange', updateVisibility)
      observer = new MutationObserver(updateModal)
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['open'],
      })
      viewport = window.visualViewport
      viewport?.addEventListener('resize', updateViewport)
      viewport?.addEventListener('scroll', updateViewport)
      updateViewport()
      host.activate()
    })
    onBeforeUnmount(() => {
      observer?.disconnect()
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', updateVisibility)
      viewport?.removeEventListener('resize', updateViewport)
      viewport?.removeEventListener('scroll', updateViewport)
      host.deactivate()
    })
    return () => {
      if (!mounted.value) return null
      const { colors, typography, radius } = theme.value
      const { message, visible } = host.snapshot.value
      const tone = message ? tones[message.tone] : 'accent'
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            class: 'm-toast-host',
            hidden: covered.value,
            style: {
              top: `calc(${top.value + 16}px + env(safe-area-inset-top, 0px))`,
              '--m-focus': colors.primary,
            },
          },
          [
            // Keep the live region mounted before its text changes. The close control stays outside it.
            h(
              'span',
              {
                class: 'm-toast-announcement',
                role: 'status',
                'aria-live': 'polite',
                'aria-atomic': 'true',
              },
              announcement.value,
            ),
            h(
              Transition,
              {
                name: 'm-toast',
                appear: true,
                onBeforeEnter: () => {
                  if (!message) return
                  host.begin(message.id)
                  opener =
                    document.activeElement instanceof HTMLElement
                      ? document.activeElement
                      : undefined
                  enteredId = undefined
                  announcement.value = ''
                },
                onAfterEnter: () => {
                  if (!message) return
                  enteredId = message.id
                  announce()
                  host.entered(message.id)
                },
                onBeforeLeave: (element: Element) => {
                  restoreFocus(element)
                  element.setAttribute('inert', '')
                  element.setAttribute('aria-hidden', 'true')
                  announcement.value = ''
                  host.pause('hover', false)
                  host.pause('focus', false)
                },
                onAfterLeave: () => {
                  if (message) host.left(message.id)
                },
              },
              {
                default: () =>
                  message && visible
                    ? h(
                        'div',
                        {
                          key: message.id,
                          class: 'm-toast',
                          'data-tone': message.tone,
                          style: {
                            backgroundColor: colors.surface,
                            color: colors.text,
                            borderColor: colors.border,
                            borderRadius: `${radius.lg}px`,
                            fontFamily: 'inherit',
                            fontSize: `${typography.body.fontSize}px`,
                          },
                          onPointerenter: () => host.pause('hover', true),
                          onPointerleave: () => host.pause('hover', false),
                          onFocusin: () => host.pause('focus', true),
                          onFocusout: (event: FocusEvent) => {
                            if (
                              !(event.currentTarget as Element).contains(
                                event.relatedTarget as Node | null,
                              )
                            )
                              host.pause('focus', false)
                          },
                          onKeydown: (event: KeyboardEvent) => {
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              event.stopPropagation()
                              props.controller.dismiss(message.id)
                            }
                          },
                        },
                        [
                          h(
                            'div',
                            { class: 'm-toast-icon', style: { backgroundColor: colors.elevated } },
                            [h(MIcon, { name: icons[message.tone], tone })],
                          ),
                          h('div', { class: 'm-toast-copy' }, [
                            message.title
                              ? h('p', { class: 'm-toast-title' }, message.title)
                              : null,
                            h(
                              'p',
                              {
                                class: 'm-toast-message',
                                style: { color: message.title ? colors.muted : colors.text },
                              },
                              message.message,
                            ),
                          ]),
                          h(
                            'button',
                            {
                              type: 'button',
                              class: 'm-toast-close',
                              'aria-label': props.closeLabel,
                              style: { color: colors.muted },
                              onClick: () => props.controller.dismiss(message.id),
                            },
                            [h(MIcon, { name: 'x', tone: 'muted' })],
                          ),
                        ],
                      )
                    : null,
              },
            ),
          ],
        ),
      ])
    }
  },
})
