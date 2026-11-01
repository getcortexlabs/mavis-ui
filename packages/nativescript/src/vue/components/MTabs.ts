import {
  computed,
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  ref,
  registerElement,
  watch,
  type SlotsType,
} from 'nativescript-vue'
import type { EventData, ScrollView, View } from '@nativescript/core'
import { animate, onReducedMotion, set } from '@rafaelaugusto/jolt'
import {
  canChoose,
  choiceKey,
  tabFocusTarget,
  tabScrollOffset,
  validateTabs,
  type TabOption,
  type TabPanelProps,
} from '@getcortexlabs/mavis-core'
import { tabsProps, tabsEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MavisButton } from '../../native/button'
import { observeTab } from '../../native/tabs'
import { useNativeViewAttrs } from '../accessibility.js'
import { MColumn } from './layout.js'

registerElement('MavisTabButton', () => MavisButton)

export const MTabs = defineComponent({
  name: 'MTabs',
  inheritAttrs: false,
  props: tabsProps,
  emits: tabsEmits,
  slots: Object as SlotsType<{ default: TabPanelProps }>,
  setup(props, { attrs, emit, slots }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const controls = new Map<string, View>()
    const observers = new Map<string, () => void>()
    const focusKey = ref<string>()
    const selected = computed(() => {
      validateTabs(props.tabs, props.modelValue, props.label)
      return props.tabs.find((tab) => tab.value === props.modelValue)
    })
    let scroll: ScrollView | undefined, row: View | undefined, indicator: View | undefined
    let motion: ReturnType<typeof animate> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let reduced: (() => void) | undefined
    let previous: { key: string; x: number; width: number } | undefined
    let animateNext = false
    function reveal(view: View) {
      if (!scroll || !row) return
      const point = view.getLocationRelativeTo(row)
      if (!point) return
      const offset = tabScrollOffset(
        point.x,
        view.getActualSize().width,
        scroll.horizontalOffset,
        scroll.getActualSize().width,
      )
      if (Math.abs(offset - scroll.horizontalOffset) > 0.5)
        scroll.scrollToHorizontalOffset(offset, false)
    }
    function update() {
      timer = undefined
      if (!scroll || !row || !indicator) return
      const active = selected.value
      const key = active && choiceKey(active.value)
      const button = key && controls.get(key)
      const point = button && button.getLocationRelativeTo(row)
      const width = button && button.getActualSize().width
      if (!key || !button || !point || !width) {
        motion?.stop()
        motion = undefined
        indicator.opacity = 0
        previous = undefined
        animateNext = false
        return
      }
      const changed = !previous || previous.x !== point.x || previous.width !== width
      if (changed) {
        motion?.stop()
        motion = undefined
        indicator.width = width
        indicator.opacity = 1
        if (previous && animateNext)
          motion = animate(indicator, { x: point.x }, { type: 'spring', duration: 240, bounce: 0 })
        else set(indicator, { x: point.x })
      }
      previous = { key, x: point.x, width }
      animateNext = false
      reveal(button)
    }
    function schedule(animated = false) {
      animateNext ||= animated
      if (timer === undefined) timer = setTimeout(update, 0)
    }
    function release() {
      clearTimeout(timer)
      timer = undefined
      motion?.stop()
      motion = undefined
      reduced?.()
      reduced = undefined
      for (const dispose of observers.values()) dispose()
      observers.clear()
      controls.clear()
      scroll = undefined
      row = indicator = undefined
      previous = undefined
      animateNext = false
      focusKey.value = undefined
    }
    onBeforeUnmount(release)
    watch(
      () => props.modelValue,
      () => schedule(true),
      { flush: 'post' },
    )
    watch(
      () => [props.tabs, props.disabled],
      () => schedule(),
      { deep: true, flush: 'post' },
    )
    function navigate(tab: TabOption, key: string) {
      if (props.disabled || props.tabs.find((item) => item.value === tab.value)?.disabled) return
      const next = tabFocusTarget(props.tabs, tab.value, key)
      const button = next && controls.get(choiceKey(next.value))
      if (button) {
        button.focus()
        reveal(button)
      }
    }
    return () => {
      const active = selected.value
      const { colors, typography } = theme.value
      return h(
        MColumn,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          gap: 'md',
          accessibilityHidden: props.accessibilityHidden,
        }),
        {
          default: () => [
            h(
              'ScrollView',
              {
                orientation: 'horizontal',
                scrollBarIndicatorVisible: false,
                accessibilityHidden: props.accessibilityHidden,
                onLoaded: (event: EventData) => {
                  scroll = event.object as ScrollView
                  reduced?.()
                  reduced = onReducedMotion((value) => {
                    if (value && indicator && previous) {
                      motion?.stop()
                      motion = undefined
                      set(indicator, { x: previous.x })
                    }
                  })
                  schedule()
                },
                onLayoutChanged: () => schedule(),
                onUnloaded: release,
              },
              [
                h('MavisBox', { verticalAlignment: 'top' }, [
                  h(
                    'StackLayout',
                    {
                      orientation: 'horizontal',
                      horizontalAlignment: 'left',
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      onLoaded: (event: EventData) => {
                        row = event.object as View
                        schedule()
                      },
                      onLayoutChanged: () => schedule(),
                    },
                    props.tabs.map((tab) => {
                      const key = choiceKey(tab.value),
                        chosen = active?.value === tab.value
                      const disabled = props.disabled || Boolean(tab.disabled)
                      return h('MavisTabButton', {
                        ...nativeAttrs(),
                        id: undefined,
                        key,
                        text: tab.label,
                        textWrap: false,
                        accessible: true,
                        accessibilityRole: 'button',
                        accessibilityLabel: tab.label,
                        accessibilityHint: props.label,
                        accessibilityState: [chosen ? 'selected' : '', disabled ? 'disabled' : '']
                          .filter(Boolean)
                          .join(','),
                        isEnabled: !disabled,
                        iosAccessibilityAdjustsFontSize: true,
                        style: {
                          minHeight: 52,
                          minWidth: 48,
                          margin: 0,
                          paddingLeft: 20,
                          paddingRight: 20,
                          paddingTop: 14,
                          paddingBottom: 17,
                          fontSize: typography.body.fontSize,
                          fontWeight: '600',
                          textTransform: 'none',
                          color: chosen ? colors.primary : colors.muted,
                          backgroundColor:
                            focusKey.value === key ? colors.primarySoft : 'transparent',
                          borderWidth: 0,
                          borderRadius: 0,
                          opacity: disabled ? 0.4 : 1,
                          androidElevation: 0,
                          androidDynamicElevationOffset: 0,
                        },
                        onTap: () => {
                          if (canChoose(tab, props.modelValue, props.disabled))
                            emit('update:modelValue', tab.value)
                        },
                        onLoaded: (event: EventData) => {
                          const button = event.object as View
                          controls.set(key, button)
                          observers.get(key)?.()
                          observers.set(
                            key,
                            observeTab(
                              button,
                              (focused) => {
                                if (focused) focusKey.value = key
                                else if (focusKey.value === key) focusKey.value = undefined
                              },
                              (direction) => navigate(tab, direction),
                            ),
                          )
                          schedule()
                        },
                        onUnloaded: () => {
                          observers.get(key)?.()
                          observers.delete(key)
                          controls.delete(key)
                        },
                        onLayoutChanged: () => schedule(),
                      })
                    }),
                  ),
                  h('MavisBox', {
                    accessible: false,
                    accessibilityHidden: true,
                    isUserInteractionEnabled: false,
                    horizontalAlignment: 'left',
                    verticalAlignment: 'bottom',
                    width: 1,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                    opacity: 0,
                    onLoaded: (event: EventData) => {
                      indicator = event.object as View
                      schedule()
                    },
                  }),
                ]),
              ],
            ),
            active
              ? h(
                  MColumn,
                  { key: choiceKey(active.value) },
                  { default: () => slots.default?.({ value: active.value }) },
                )
              : null,
          ],
        },
      )
    }
  },
})
