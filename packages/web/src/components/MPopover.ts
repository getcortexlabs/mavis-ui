import { useComponentTransition } from '../component-motion.js'
import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onDeactivated,
  onActivated,
  ref,
  shallowRef,
  Teleport,
  Transition,
  useId,
  watch,
} from 'vue'
import { popoverProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { placePopover, resolveSpace, type PopoverCloseReason } from '@getcortexlabs/mavis-core'
import { MButton } from './MButton.js'

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
    const { theme } = useMavisTheme()
    const presentation = useComponentTransition(6)
    const transition = {
      ...presentation,
      onBeforeLeave: (element: Element) => {
        element.setAttribute('inert', '')
        element.setAttribute('aria-hidden', 'true')
      },
      onBeforeEnter: (element: Element) => {
        element.removeAttribute('inert')
        element.removeAttribute('aria-hidden')
      },
    }
    const id = `m-popover-${useId()}`
    const anchor = ref<HTMLElement>()
    const trigger = ref<{ $el?: HTMLElement }>()
    const panel = ref<HTMLElement>()
    const host = shallowRef<HTMLElement>()
    const position = ref({ x: 0, y: 0 })
    const ready = ref(false)
    let observer: ResizeObserver | undefined
    let frame = 0
    let generation = 0
    let mounted = false
    let reason: PopoverCloseReason = 'program'
    function owns(target: EventTarget | null) {
      return (
        target instanceof Node && (anchor.value?.contains(target) || panel.value?.contains(target))
      )
    }
    function close(value: PopoverCloseReason) {
      if (!props.open) return
      reason = value
      emit('update:open', false)
      emit('close', value)
    }
    function place() {
      frame = 0
      if (!anchor.value || !panel.value || !props.open) return
      const a = anchor.value.getBoundingClientRect()
      if (!anchor.value.isConnected || !a.width || !a.height) {
        close('program')
        return
      }
      const viewport = window.visualViewport
      position.value = placePopover(
        a,
        panel.value.getBoundingClientRect(),
        {
          x: viewport?.offsetLeft ?? 0,
          y: viewport?.offsetTop ?? 0,
          width: viewport?.width ?? window.innerWidth,
          height: viewport?.height ?? window.innerHeight,
        },
        props.placement,
        getComputedStyle(anchor.value).direction === 'rtl',
      )
      ready.value = true
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(place)
    }
    function outside(event: Event) {
      if (!owns(event.target)) close('outside')
    }
    function focusout(event: FocusEvent) {
      if (!owns(event.target)) close('outside')
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && owns(event.target)) {
        event.preventDefault()
        event.stopPropagation()
        close('escape')
      }
      if (
        event.key === 'Tab' &&
        props.role === 'menu' &&
        panel.value?.contains(event.target as Node)
      ) {
        event.preventDefault()
        const controls = [
          ...document.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ].filter(
          (control) =>
            control.tabIndex >= 0 &&
            !panel.value?.contains(control) &&
            !control.closest('[inert], [hidden]') &&
            control.getClientRects().length,
        )
        const index = controls.indexOf(trigger.value?.$el as HTMLElement)
        close('outside')
        ;(controls[index + (event.shiftKey ? -1 : 1)] ?? trigger.value?.$el)?.focus({
          preventScroll: true,
        })
      }
    }
    function detach() {
      generation++
      observer?.disconnect()
      observer = undefined
      if (typeof window === 'undefined') return
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      window.removeEventListener('resize', schedule)
      document.removeEventListener('scroll', schedule, true)
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', focusout)
      document.removeEventListener('keydown', escape)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
    async function present() {
      detach()
      if (!mounted || !props.open || props.disabled) return
      const token = generation
      reason = 'program'
      ready.value = false
      host.value = anchor.value?.closest('dialog') ?? document.body
      await nextTick()
      if (!mounted || token !== generation || !props.open || !panel.value) return
      place()
      observer = new ResizeObserver(schedule)
      observer.observe(panel.value)
      if (anchor.value) observer.observe(anchor.value)
      window.addEventListener('resize', schedule)
      document.addEventListener('scroll', schedule, true)
      document.addEventListener('pointerdown', outside, true)
      document.addEventListener('focusin', focusout)
      document.addEventListener('keydown', escape)
      window.visualViewport?.addEventListener('resize', schedule)
      window.visualViewport?.addEventListener('scroll', schedule)
      await nextTick()
      if (token !== generation || !props.open) return
      ;(
        panel.value?.querySelector<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? panel.value
      )?.focus({ preventScroll: true })
      emit('opened')
    }
    watch(
      () => props.open,
      (open) => {
        if (open) void present()
        else {
          const focused =
            typeof document !== 'undefined' && panel.value?.contains(document.activeElement)
          detach()
          if (focused && reason !== 'outside') trigger.value?.$el?.focus({ preventScroll: true })
        }
      },
    )
    watch(
      () => props.disabled,
      (value) => {
        if (value && props.open) close('program')
      },
    )
    watch(
      () => [props.placement, props.width],
      () => {
        if (props.open && mounted) schedule()
      },
    )
    onMounted(() => {
      mounted = true
      void present()
    })
    onActivated(() => {
      if (!mounted) {
        mounted = true
        void present()
      }
    })
    onDeactivated(() => {
      mounted = false
      detach()
      host.value = undefined
      if (props.open) close('program')
    })
    onBeforeUnmount(() => {
      mounted = false
      detach()
    })
    return () => {
      if (!props.label.trim() || !props.triggerLabel.trim())
        throw new TypeError('Popovers require panel and trigger labels.')
      if (!Number.isFinite(props.width) || props.width <= 0)
        throw new RangeError('Popover width must be positive and finite.')
      const panelId = props.id ?? id
      return h(
        'span',
        mergeProps(
          {
            ref: anchor,
            class: 'm-popover-anchor',
            style: { display: 'inline-flex', alignSelf: 'flex-start' },
          },
          attrs,
        ),
        [
          h(MButton, {
            ref: trigger,
            text: props.triggerLabel,
            icon: props.icon,
            variant: props.variant,
            disabled: props.disabled,
            'aria-haspopup': props.role,
            'aria-expanded': props.open,
            'aria-controls': panelId,
            onClick: () => (props.open ? close('trigger') : emit('update:open', true)),
            onKeydown: (event: KeyboardEvent) => {
              if (event.key === 'ArrowDown' && !props.open) {
                event.preventDefault()
                emit('update:open', true)
              }
            },
          }),
          host.value
            ? h(
                Teleport,
                { to: host.value },
                h(Transition, transition, {
                  default: () =>
                    props.open && !props.disabled
                      ? h(
                          'div',
                          {
                            ref: panel,
                            inert: !props.open || undefined,
                            'aria-hidden': !props.open || undefined,
                            id: panelId,
                            role: props.role,
                            'aria-label': props.label,
                            tabindex: -1,
                            class: 'm-popover-panel',
                            style: {
                              position: 'fixed',
                              zIndex: 1000,
                              boxSizing: 'border-box',
                              left: `${position.value.x}px`,
                              top: `${position.value.y}px`,
                              width: `${props.width}px`,
                              maxWidth: 'calc(100vw - 16px)',
                              maxHeight: 'calc(100dvh - 16px)',
                              overflow: 'auto',
                              visibility: ready.value ? 'visible' : 'hidden',
                              padding: `${resolveSpace(theme.value, props.padding)}px`,
                              background: theme.value.colors.surface,
                              color: theme.value.colors.text,
                              border: `1px solid ${theme.value.colors.border}`,
                              borderRadius: `${theme.value.radius.md}px`,
                              boxShadow: '0 12px 36px #0002',
                              colorScheme: theme.value.appearance,
                            },
                          },
                          slots.default?.({ close: () => close('program') }),
                        )
                      : null,
                }),
              )
            : null,
        ],
      )
    }
  },
})
