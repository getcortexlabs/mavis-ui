import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  ref,
  registerElement,
  watch,
} from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import {
  canChoose,
  choiceKey,
  segmentedFocusTarget,
  validateSegments,
  type SegmentedOption,
} from '@getcortexlabs/mavis-core'
import { segmentedProps, segmentedEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MavisButton } from '../../native/button'
import { observeTab } from '../../native/tabs'
import { attachSegmentedIndicator } from '../../native/segmented'
import { useNativeViewAttrs } from '../accessibility.js'
import { MBox, MRow } from './layout.js'

registerElement('MavisSegmentButton', () => MavisButton)

export const MSegmentedControl = defineComponent({
  name: 'MSegmentedControl',
  inheritAttrs: false,
  props: segmentedProps,
  emits: segmentedEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const controls = new Map<string, View>()
    const observers = new Map<string, () => void>()
    const focusKey = ref<string>()
    let row: View | undefined, indicator: View | undefined
    let motion: ReturnType<typeof attachSegmentedIndicator> | undefined
    function connect() {
      if (row && indicator && !motion)
        motion = attachSegmentedIndicator(indicator, () => {
          const active = props.options.find((option) => option.value === props.modelValue)
          const key = active && choiceKey(active.value)
          const button = key && controls.get(key)
          const point = button && row && button.getLocationRelativeTo(row)
          if (!key || !button || !point) return
          return { key, x: point.x, ...button.getActualSize() }
        })
      motion?.update()
    }
    function release() {
      motion?.dispose()
      motion = undefined
      for (const dispose of observers.values()) dispose()
      observers.clear()
      controls.clear()
      row = indicator = undefined
      focusKey.value = undefined
    }
    onBeforeUnmount(release)
    watch(
      () => props.modelValue,
      () => motion?.update(true),
      { flush: 'post' },
    )
    watch(
      () => [props.options, props.disabled],
      () => motion?.update(),
      { deep: true, flush: 'post' },
    )
    function request(option: SegmentedOption) {
      if (canChoose(option, props.modelValue, props.disabled))
        emit('update:modelValue', option.value)
    }
    function navigate(option: SegmentedOption, key: string) {
      if (props.disabled || props.options.find((item) => item.value === option.value)?.disabled)
        return
      const rtl =
        row?.android?.getLayoutDirection() === 1 ||
        row?.ios?.effectiveUserInterfaceLayoutDirection === 1
      const next = segmentedFocusTarget(props.options, option.value, key, rtl)
      if (!next) return
      controls.get(choiceKey(next.value))?.focus()
      request(next)
    }
    return () => {
      validateSegments(props.options, props.modelValue, props.label)
      const { colors, radius, typography } = theme.value
      return h(
        MBox,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          padding: 4,
          radius: 'md',
          backgroundColor: colors.elevated,
          style: { borderWidth: 1, borderColor: colors.border, opacity: props.disabled ? 0.45 : 1 },
          onUnloaded: release,
        }),
        {
          default: () => [
            h('MavisBox', {
              accessible: false,
              accessibilityHidden: true,
              isUserInteractionEnabled: false,
              horizontalAlignment: 'left',
              verticalAlignment: 'top',
              width: 1,
              height: 1,
              backgroundColor: colors.primarySoft,
              borderRadius: Math.max(0, radius.md - 4),
              opacity: 0,
              onLoaded: (event: EventData) => {
                indicator = event.object as View
                connect()
              },
            }),
            h(
              MRow,
              {
                gap: 4,
                align: 'stretch',
                onLoaded: (event: EventData) => {
                  row = event.object as View
                  connect()
                },
                onLayoutChanged: () => motion?.update(),
              },
              {
                default: () =>
                  props.options.map((option) => {
                    const key = choiceKey(option.value),
                      selected = option.value === props.modelValue
                    const disabled = props.disabled || Boolean(option.disabled)
                    return h('MavisSegmentButton', {
                      ...nativeAttrs(),
                      id: undefined,
                      key,
                      text: option.label,
                      textWrap: true,
                      accessible: true,
                      accessibilityRole: 'radioButton',
                      accessibilityLabel: option.label,
                      accessibilityHint: props.label,
                      accessibilityState: selected ? 'checked' : 'unchecked',
                      isEnabled: !disabled,
                      iosAccessibilityAdjustsFontSize: true,
                      style: {
                        width: 0,
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 48,
                        margin: 0,
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 10,
                        paddingBottom: 10,
                        fontSize: typography.body.fontSize,
                        fontWeight: '600',
                        textTransform: 'none',
                        color: selected ? colors.primary : colors.text,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderColor: focusKey.value === key ? colors.primary : 'transparent',
                        borderRadius: Math.max(0, radius.md - 4),
                        opacity: option.disabled && !props.disabled ? 0.45 : 1,
                        androidElevation: 0,
                        androidDynamicElevationOffset: 0,
                      },
                      onTap: () => request(option),
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
                            (direction) => navigate(option, direction),
                          ),
                        )
                        motion?.update()
                      },
                      onUnloaded: () => {
                        observers.get(key)?.()
                        observers.delete(key)
                        controls.delete(key)
                        motion?.update()
                      },
                      onLayoutChanged: () => motion?.update(),
                    })
                  }),
              },
            ),
          ],
        },
      )
    }
  },
})
