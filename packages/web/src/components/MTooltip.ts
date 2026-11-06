import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  Teleport,
  Transition,
  withDirectives,
  vShow,
  useId,
  watch,
} from 'vue'
import { placePopover } from '@getcortexlabs/mavis-core'
import { useComponentTransition } from '../component-motion.js'
import { tooltipProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MButton } from './MButton.js'
import { MBox } from './layout.js'

/** Non-interactive help. Focus remains on the trigger; touch users can toggle it. */
export const MTooltip = defineComponent({
  name: 'MTooltip',
  inheritAttrs: false,
  props: tooltipProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const id = `m-tooltip-${useId()}`
    const trigger = ref<{ $el?: HTMLElement }>()
    const panel = ref<HTMLElement>()
    const host = shallowRef<HTMLElement>()
    const open = ref(false),
      ready = ref(false)
    const position = ref({ x: 0, y: 0 })
    let hovered = false,
      focused = false,
      pinned = false,
      suppressed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let observer: ResizeObserver | undefined
    let frame = 0,
      revision = 0
    let active = false
    const transition = useComponentTransition(3)
    function clearTimer() {
      if (timer) clearTimeout(timer)
      timer = undefined
    }
    function close() {
      clearTimer()
      open.value = false
      pinned = false
    }
    function place() {
      frame = 0
      const anchor = trigger.value?.$el,
        popup = panel.value
      if (!active || !open.value || !anchor || !popup) return
      const rect = anchor.getBoundingClientRect()
      if (!anchor.isConnected || !rect.width || !rect.height) {
        close()
        return
      }
      const viewport = window.visualViewport
      position.value = placePopover(
        rect,
        popup.getBoundingClientRect(),
        {
          x: viewport?.offsetLeft ?? 0,
          y: viewport?.offsetTop ?? 0,
          width: viewport?.width ?? window.innerWidth,
          height: viewport?.height ?? window.innerHeight,
        },
        props.placement,
        getComputedStyle(anchor).direction === 'rtl',
      )
      ready.value = true
    }
    const schedule = () => {
      if (open.value && !frame) frame = requestAnimationFrame(place)
    }
    const escape = (event: KeyboardEvent) => {
      if (open.value && event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        suppressed = true
        close()
      }
    }
    const outside = (event: PointerEvent) => {
      if (
        !trigger.value?.$el?.contains(event.target as Node) &&
        !panel.value?.contains(event.target as Node)
      )
        close()
    }
    function detach() {
      revision++
      observer?.disconnect()
      observer = undefined
      if (typeof window === 'undefined') return
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      window.removeEventListener('resize', schedule)
      document.removeEventListener('scroll', schedule, true)
      document.removeEventListener('keydown', escape, true)
      document.removeEventListener('pointerdown', outside, true)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
    async function present() {
      detach()
      ready.value = false
      if (!active || !open.value || props.disabled) return
      const token = revision
      host.value = trigger.value?.$el?.closest('dialog') ?? document.body
      await nextTick()
      if (token !== revision || !active || !open.value) return
      place()
      observer = new ResizeObserver(schedule)
      if (panel.value) observer.observe(panel.value)
      if (trigger.value?.$el) observer.observe(trigger.value.$el)
      window.addEventListener('resize', schedule)
      document.addEventListener('scroll', schedule, true)
      document.addEventListener('keydown', escape, true)
      document.addEventListener('pointerdown', outside, true)
      window.visualViewport?.addEventListener('resize', schedule)
      window.visualViewport?.addEventListener('scroll', schedule)
    }
    function show(delay = 0) {
      clearTimer()
      if (props.disabled || suppressed || !active) return
      if (delay)
        timer = setTimeout(() => {
          open.value = true
        }, delay)
      else open.value = true
    }
    function leave() {
      clearTimer()
      if (!hovered && !focused && !pinned) timer = setTimeout(close, 120)
    }
    watch(open, (value) => {
      if (value) void present()
      else detach()
    })
    watch(
      () => props.disabled,
      (value) => {
        if (value) close()
      },
    )
    watch(() => props.placement, schedule)
    onMounted(() => {
      active = true
      host.value = trigger.value?.$el?.closest('dialog') ?? document.body
    })
    onActivated(() => {
      active = true
    })
    onDeactivated(() => {
      active = false
      close()
      detach()
      hovered = focused = pinned = false
    })
    onBeforeUnmount(() => {
      active = false
      clearTimer()
      detach()
    })
    return () => {
      if (!props.text.trim() || !props.triggerLabel.trim())
        throw new TypeError('Tooltip requires text and a trigger label.')
      if (!Number.isFinite(props.delay) || props.delay < 0)
        throw new RangeError('Tooltip delay must be nonnegative and finite.')
      const tooltipId = props.id ?? id
      const content = h(
        'span',
        {
          ref: panel,
          id: tooltipId,
          role: 'tooltip',
          'aria-hidden': !open.value || undefined,
          class: 'm-tooltip-content',
          style: {
            position: 'fixed',
            zIndex: 1100,
            left: `${position.value.x}px`,
            top: `${position.value.y}px`,
            width: 'max-content',
            maxWidth: 'min(300px, calc(100vw - 16px))',
            visibility: ready.value ? 'visible' : 'hidden',
          },
          onPointerenter: () => {
            hovered = true
            clearTimer()
          },
          onPointerleave: () => {
            hovered = false
            leave()
          },
        },
        [
          h(
            MBox,
            {
              padding: 'sm',
              radius: 'md',
              backgroundColor: theme.value.colors.text,
              style: {
                color: theme.value.colors.background,
                fontSize: '13px',
                lineHeight: 1.5,
                boxShadow: '0 6px 20px #0002',
                overflowWrap: 'anywhere',
              },
            },
            () => props.text,
          ),
        ],
      )
      return h(
        'span',
        mergeProps(attrs, {
          class: 'm-tooltip',
          style: { display: 'inline-flex', alignSelf: 'flex-start' },
        }),
        [
          h(MButton, {
            ref: trigger,
            icon: props.icon,
            accessibilityLabel: props.triggerLabel,
            variant: props.variant,
            disabled: props.disabled,
            'aria-describedby': tooltipId,
            onPointerenter: (event: PointerEvent) => {
              if (event.pointerType === 'touch') return
              hovered = true
              suppressed = false
              show(props.delay)
            },
            onPointerleave: () => {
              hovered = false
              if (!focused) suppressed = false
              leave()
            },
            onFocus: () => {
              focused = true
              suppressed = false
              show()
            },
            onBlur: () => {
              focused = false
              pinned = false
              leave()
            },
            onClick: () => {
              if (props.disabled) return
              if (pinned) {
                suppressed = true
                close()
              } else {
                pinned = true
                suppressed = false
                show()
              }
            },
          }),
          host.value
            ? h(
                Teleport,
                { to: host.value },
                h(Transition, transition, {
                  default: () => withDirectives(content, [[vShow, open.value]]),
                }),
              )
            : withDirectives(content, [[vShow, false]]),
        ],
      )
    }
  },
})
