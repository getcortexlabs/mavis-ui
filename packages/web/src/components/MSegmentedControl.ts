import { fontFamily } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps, nextTick, onBeforeUnmount, watch } from 'vue'
import {
  canChoose,
  choiceKey,
  segmentedFocusTarget,
  segmentedMotion,
  validateSegments,
  type SegmentedOption,
} from '@getcortexlabs/mavis-core'
import { segmentedProps, segmentedEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'

export const MSegmentedControl = defineComponent({
  name: 'MSegmentedControl',
  inheritAttrs: false,
  props: segmentedProps,
  emits: segmentedEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const controls = new Map<string, HTMLButtonElement>()
    let alive = true
    onBeforeUnmount(() => {
      alive = false
      controls.clear()
    })
    watch(
      () => [props.options, props.disabled],
      () => {
        if (typeof document === 'undefined') return
        const focused = [...controls].find(([, element]) => element === document.activeElement)
        if (!focused) return
        const option = props.options.find((option) => choiceKey(option.value) === focused[0])
        if (option && !option.disabled && !props.disabled) return
        void nextTick(() => {
          if (!alive || props.disabled) return
          const enabled = props.options.filter((option) => !option.disabled)
          const next = enabled.find((option) => option.value === props.modelValue) ?? enabled[0]
          if (next) controls.get(choiceKey(next.value))?.focus({ preventScroll: true })
        })
      },
      { deep: true, flush: 'pre' },
    )
    function request(option: SegmentedOption) {
      if (canChoose(option, props.modelValue, props.disabled))
        emit('update:modelValue', option.value)
    }
    function keydown(event: KeyboardEvent, option: SegmentedOption) {
      if (props.disabled || option.disabled || event.altKey || event.ctrlKey || event.metaKey)
        return
      const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl'
      const next = segmentedFocusTarget(props.options, option.value, event.key, rtl)
      if (!next) return
      event.preventDefault()
      controls.get(choiceKey(next.value))?.focus({ preventScroll: true })
      request(next)
    }
    return () => {
      validateSegments(props.options, props.modelValue, props.label)
      const { colors, radius, typography } = theme.value
      const enabled = props.options.filter((option) => !option.disabled)
      const tabValue =
        enabled.find((option) => option.value === props.modelValue)?.value ?? enabled[0]?.value
      const index = props.options.findIndex((option) => option.value === props.modelValue)
      const count = props.options.length
      return h(
        MColumn,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          class: 'm-segmented',
          role: 'radiogroup',
          'aria-label': props.label,
          'aria-disabled': props.disabled || undefined,
          style: {
            padding: '4px',
            border: `1px solid ${colors.border}`,
            borderRadius: `${radius.md}px`,
            background: colors.elevated,
            opacity: props.disabled ? 0.45 : 1,
            '--m-focus': colors.primary,
            '--m-segment-radius': `${Math.max(0, radius.md - 4)}px`,
            '--m-segment-duration': `${segmentedMotion.duration}ms`,
            '--m-segment-ease': segmentedMotion.cssEase,
          },
        }),
        {
          default: () =>
            h(
              'div',
              {
                class: 'm-segmented-track',
                style: { gridTemplateColumns: `repeat(${Math.max(1, count)}, minmax(0, 1fr))` },
              },
              [
                h('span', {
                  class: 'm-segmented-marker',
                  'aria-hidden': 'true',
                  style: {
                    background: colors.primarySoft,
                    visibility: index < 0 ? 'hidden' : 'visible',
                    width: count ? `calc((100% - ${(count - 1) * 4}px) / ${count})` : 0,
                    '--m-segment-offset': `calc(${Math.max(0, index) * 100}% + ${Math.max(0, index) * 4}px)`,
                  },
                }),
                ...props.options.map((option) => {
                  const key = choiceKey(option.value),
                    selected = option.value === props.modelValue
                  const disabled = props.disabled || option.disabled
                  return h(
                    'button',
                    {
                      key,
                      type: 'button',
                      role: 'radio',
                      class: 'm-segmented-option',
                      ref: (element: unknown) => {
                        if (element) controls.set(key, element as HTMLButtonElement)
                        else controls.delete(key)
                      },
                      disabled,
                      tabindex: !disabled && option.value === tabValue ? 0 : -1,
                      'aria-checked': selected,
                      style: {
                        color: selected ? colors.primary : colors.text,
                        fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
                        fontSize: `${typography.body.fontSize}px`,
                        opacity: option.disabled && !props.disabled ? 0.45 : 1,
                      },
                      onClick: () => request(option),
                      onKeydown: (event: KeyboardEvent) => keydown(event, option),
                    },
                    option.label,
                  )
                }),
              ],
            ),
        },
      )
    }
  },
})
