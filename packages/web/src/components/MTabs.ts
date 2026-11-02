import { fontFamily } from '@getcortexlabs/mavis-core'
import {
  computed,
  KeepAlive,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  onMounted,
  ref,
  useId,
  watch,
  type SlotsType,
} from 'vue'
import {
  canChoose,
  choiceKey,
  tabFocusTarget,
  validateTabs,
  type TabOption,
  type TabPanelProps,
} from '@getcortexlabs/mavis-core'
import { useButtonAction, tabsProps, tabsEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'

const TabPanel = defineComponent({
  name: 'MTabPanel',
  setup(_props, { slots }) {
    useButtonAction()
    return () => h('div', {}, slots.default?.())
  },
})

export const MTabs = defineComponent({
  name: 'MTabs',
  inheritAttrs: false,
  props: tabsProps,
  emits: tabsEmits,
  slots: Object as SlotsType<{ default: TabPanelProps }>,
  setup(props, { attrs, emit, slots }) {
    const { theme } = useMavisTheme()
    const generated = `m-tabs-${useId()}`
    const controls = new Map<string, HTMLButtonElement>()
    const track = ref<HTMLElement>(),
      scroller = ref<HTMLElement>()
    const marker = ref<{ left: number; width: number }>()
    const focusValue = ref(props.modelValue)
    const selected = computed(() => {
      validateTabs(props.tabs, props.modelValue, props.label)
      return props.tabs.find((tab) => tab.value === props.modelValue)
    })
    let observer: ResizeObserver | undefined
    let frame: number | undefined
    let alive = false
    function reveal(button: HTMLButtonElement) {
      if (!scroller.value) return
      const bounds = button.getBoundingClientRect(),
        viewport = scroller.value.getBoundingClientRect()
      const delta =
        bounds.left < viewport.left
          ? bounds.left - viewport.left
          : bounds.right > viewport.right
            ? bounds.right - viewport.right
            : 0
      if (delta) scroller.value.scrollBy({ left: delta, behavior: 'instant' })
    }
    function measure(revealSelection = false) {
      if (!alive) return
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = undefined
        const button = selected.value && controls.get(choiceKey(selected.value.value))
        marker.value = button ? { left: button.offsetLeft, width: button.offsetWidth } : undefined
        if (button && revealSelection) reveal(button)
      })
    }
    function observe() {
      observer?.disconnect()
      if (!alive) return
      if (track.value) observer?.observe(track.value)
      if (scroller.value) observer?.observe(scroller.value)
      for (const button of controls.values()) observer?.observe(button)
      measure(true)
    }
    const start = () => {
      if (alive) return
      alive = true
      observer = new ResizeObserver(() => measure(true))
      observe()
    }
    const stop = () => {
      alive = false
      observer?.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = undefined
    }
    onMounted(start)
    onActivated(start)
    onDeactivated(stop)
    watch(
      () => [props.modelValue, props.tabs, props.disabled],
      () => {
        const focused = typeof document !== 'undefined' ? document.activeElement : null
        const ownedFocus = focused && track.value?.contains(focused)
        focusValue.value = props.modelValue
        void nextTick(() => {
          observe()
          if (!alive || !ownedFocus || props.disabled) return
          const stillAvailable = props.tabs.some(
            (tab) => !tab.disabled && controls.get(choiceKey(tab.value)) === focused,
          )
          if (stillAvailable) return
          const next =
            props.tabs.find((tab) => !tab.disabled && tab.value === props.modelValue) ??
            props.tabs.find((tab) => !tab.disabled)
          const button = next && controls.get(choiceKey(next.value))
          button?.focus({ preventScroll: true })
          if (button) reveal(button)
        })
      },
      { deep: true, flush: 'pre' },
    )
    onBeforeUnmount(() => {
      alive = false
      observer?.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
      controls.clear()
    })
    function request(tab: TabOption) {
      if (canChoose(tab, props.modelValue, props.disabled)) emit('update:modelValue', tab.value)
    }
    function keydown(event: KeyboardEvent, tab: TabOption) {
      if (props.disabled || tab.disabled || event.altKey || event.ctrlKey || event.metaKey) return
      const rtl = track.value && getComputedStyle(track.value).direction === 'rtl'
      const next = tabFocusTarget(props.tabs, tab.value, event.key, rtl)
      if (!next) return
      event.preventDefault()
      focusValue.value = next.value
      const button = controls.get(choiceKey(next.value))
      button?.focus({ preventScroll: true })
      if (button) reveal(button)
    }
    return () => {
      const active = selected.value
      const { colors, typography } = theme.value
      const id = props.id ?? generated
      const tabId = (tab: TabOption) => `${id}-${encodeURIComponent(choiceKey(tab.value))}`
      const focus =
        props.tabs.find((tab) => !tab.disabled && tab.value === focusValue.value) ??
        props.tabs.find((tab) => !tab.disabled)
      return h(
        MColumn,
        mergeProps(attrs, {
          id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          gap: 'md',
        }),
        {
          default: () => [
            h(
              'div',
              { ref: scroller, class: 'm-tabs-scroll', style: { '--m-focus': colors.primary } },
              [
                h(
                  'div',
                  {
                    ref: track,
                    class: 'm-tabs-track',
                    role: 'tablist',
                    'aria-label': props.label,
                    'aria-orientation': 'horizontal',
                    'aria-disabled': props.disabled || undefined,
                    style: {
                      borderBottomColor: colors.border,
                      fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
                      fontSize: `${typography.body.fontSize}px`,
                    },
                  },
                  [
                    ...props.tabs.map((tab) =>
                      h(
                        'button',
                        {
                          key: choiceKey(tab.value),
                          id: tabId(tab),
                          class: 'm-tab',
                          type: 'button',
                          role: 'tab',
                          ref: (element: unknown) => {
                            if (element)
                              controls.set(choiceKey(tab.value), element as HTMLButtonElement)
                            else controls.delete(choiceKey(tab.value))
                          },
                          disabled: props.disabled || tab.disabled,
                          tabindex: !props.disabled && focus?.value === tab.value ? 0 : -1,
                          'aria-selected': active?.value === tab.value,
                          'aria-controls': active?.value === tab.value ? `${id}-panel` : undefined,
                          style: {
                            color: active?.value === tab.value ? colors.primary : colors.muted,
                            '--m-tab-active': colors.primarySoft,
                          },
                          onFocus: () => {
                            focusValue.value = tab.value
                          },
                          onClick: () => request(tab),
                          onKeydown: (event: KeyboardEvent) => keydown(event, tab),
                        },
                        tab.label,
                      ),
                    ),
                    h('span', {
                      class: 'm-tabs-indicator',
                      'aria-hidden': 'true',
                      style: {
                        backgroundColor: colors.primary,
                        opacity: marker.value ? 1 : 0,
                        width: `${marker.value?.width ?? 0}px`,
                        transform: `translateX(${marker.value?.left ?? 0}px)`,
                      },
                    }),
                  ],
                ),
              ],
            ),
            props.keepAlive
              ? props.tabs.map((tab) =>
                  h(
                    KeepAlive,
                    { key: choiceKey(tab.value), max: 1 },
                    {
                      default: () =>
                        active?.value === tab.value
                          ? h(
                              TabPanel,
                              {
                                id: `${id}-panel`,
                                class: 'm-tab-panel',
                                role: 'tabpanel',
                                tabindex: 0,
                                'aria-labelledby': tabId(tab),
                                style: { '--m-focus': colors.primary },
                              },
                              { default: () => slots.default?.({ value: tab.value }) },
                            )
                          : null,
                    },
                  ),
                )
              : active
                ? h(
                    'div',
                    {
                      key: choiceKey(active.value),
                      id: `${id}-panel`,
                      class: 'm-tab-panel',
                      role: 'tabpanel',
                      tabindex: 0,
                      'aria-labelledby': tabId(active),
                      style: { '--m-focus': colors.primary },
                    },
                    slots.default?.({ value: active.value }),
                  )
                : null,
          ],
        },
      )
    }
  },
})
