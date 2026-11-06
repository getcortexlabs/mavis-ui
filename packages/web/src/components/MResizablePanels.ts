import { computed, defineComponent, h, mergeProps, ref, useId, watch } from 'vue'
import { panelValue, positiveSize } from '@getcortexlabs/mavis-core'
import { resizablePanelsProps, usePartition, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useAnimatedNumber } from '../animated-number.js'
import { usePartitionPointer } from '../partition-pointer.js'
import { MButton } from './MButton.js'

export const MResizablePanels = defineComponent({
  name: 'MResizablePanels',
  inheritAttrs: false,
  props: resizablePanelsProps,
  emits: { 'update:modelValue': (_value: number) => true, resize: (_value: number) => true },
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const root = ref<HTMLElement>()
    const primaryId = `m-panel-${useId()}`
    const value = computed(() =>
      panelValue(props.modelValue, props.min, props.max, props.collapsible),
    )
    let remembered = Math.max(props.min, 40)
    const state = usePartition(
      () => value.value,
      () => ({
        min: props.collapsible ? 0 : props.min,
        max: props.max,
        step: props.step,
        disabled: props.disabled,
      }),
      (next) =>
        emit('update:modelValue', next === 0 && props.collapsible ? 0 : Math.max(props.min, next)),
    )
    const shown = useAnimatedNumber(
      () => value.value,
      () => state.dragging.value,
    )
    const vertical = () => props.orientation === 'vertical'
    function finish() {
      state.end()
      const closest = props.snap
        .filter((point) => Number.isFinite(point) && point >= props.min && point <= props.max)
        .sort((a, b) => Math.abs(a - value.value) - Math.abs(b - value.value))[0]
      if (closest !== undefined && Math.abs(closest - value.value) <= 3)
        emit('update:modelValue', closest)
      emit(
        'resize',
        closest !== undefined && Math.abs(closest - value.value) <= 3 ? closest : value.value,
      )
    }
    const gestures = usePartitionPointer({
      ...state,
      value: () => value.value,
      vertical,
      direction: () => (props.direction === 'rtl' ? -1 : 1),
      disabled: () => props.disabled,
      bounds: () => {
        const box = root.value?.getBoundingClientRect()
        return box
          ? new DOMRect(
              box.x,
              box.y,
              vertical() ? box.width : Math.max(1, box.width - 44),
              vertical() ? Math.max(1, box.height - 44) : box.height,
            )
          : undefined
      },
      end: finish,
    })
    function toggle() {
      if (!props.collapsible || props.disabled) return
      if (value.value) {
        remembered = value.value
        emit('update:modelValue', 0)
      } else emit('update:modelValue', Math.max(props.min, Math.min(props.max, remembered)))
    }
    watch(
      () => [props.orientation, props.direction],
      () => state.cancel(),
    )
    return () => {
      const ratio = Math.max(0, Math.min(100, shown.value))
      const tracks = `${ratio}fr 44px ${100 - ratio}fr`
      return h(
        'div',
        mergeProps(attrs, {
          class: 'm-resizable-panels',
          role: 'group',
          'aria-label': props.label,
        }),
        [
          h(
            'div',
            {
              ref: root,
              dir: props.direction,
              style: {
                display: 'grid',
                [vertical() ? 'gridTemplateRows' : 'gridTemplateColumns']: tracks,
                height: `${positiveSize(props.height, 'height')}px`,
                minWidth: 0,
                overflow: 'hidden',
                border: `1px solid ${theme.value.colors.border}`,
                borderRadius: '16px',
              },
            },
            [
              h(
                'section',
                {
                  id: primaryId,
                  tabindex: value.value === 0 ? -1 : 0,
                  'aria-label': props.primaryLabel,
                  inert: value.value === 0 ? true : undefined,
                  style: {
                    minWidth: 0,
                    minHeight: 0,
                    overflow: 'auto',
                    visibility: ratio < 0.01 ? 'hidden' : undefined,
                  },
                },
                slots.primary?.(),
              ),
              h(
                'div',
                {
                  ...gestures,
                  role: 'separator',
                  tabindex: props.disabled ? -1 : 0,
                  'aria-label': props.label,
                  'aria-orientation': vertical() ? 'horizontal' : 'vertical',
                  'aria-valuemin': props.collapsible ? 0 : props.min,
                  'aria-valuemax': props.max,
                  'aria-valuenow': value.value,
                  'aria-valuetext': `${Math.round(value.value)}%`,
                  'aria-controls': primaryId,
                  'aria-disabled': props.disabled || undefined,
                  style: {
                    display: 'grid',
                    placeItems: 'center',
                    cursor: props.disabled ? 'default' : vertical() ? 'row-resize' : 'col-resize',
                    touchAction: 'none',
                    background: theme.value.colors.elevated,
                    outlineOffset: '-3px',
                  },
                  onDblclick: toggle,
                  onKeydown: (event: KeyboardEvent) => {
                    if (props.disabled || event.altKey || event.ctrlKey || event.metaKey) return
                    const key = event.key
                    let next: number | undefined
                    if (key === 'Home') next = props.min
                    if (key === 'End') next = props.max
                    if (key === 'Enter' && props.collapsible) {
                      event.preventDefault()
                      toggle()
                      return
                    }
                    if (key === 'Escape') {
                      state.cancel()
                      return
                    }
                    const delta = vertical()
                      ? key === 'ArrowDown'
                        ? 1
                        : key === 'ArrowUp'
                          ? -1
                          : 0
                      : (key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0) *
                        (props.direction === 'rtl' ? -1 : 1)
                    if (delta) next = value.value + delta * props.step * (event.shiftKey ? 5 : 1)
                    if (next !== undefined) {
                      event.preventDefault()
                      state.update(next)
                    }
                  },
                },
                h('span', {
                  'aria-hidden': 'true',
                  style: {
                    width: vertical() ? '28px' : '4px',
                    height: vertical() ? '4px' : '28px',
                    borderRadius: '4px',
                    background: theme.value.colors.muted,
                  },
                }),
              ),
              h(
                'section',
                {
                  tabindex: 0,
                  'aria-label': props.secondaryLabel,
                  style: { minWidth: 0, minHeight: 0, overflow: 'auto' },
                },
                slots.secondary?.(),
              ),
            ],
          ),
          props.collapsible
            ? h(MButton, {
                text: value.value ? props.collapseLabel : props.expandLabel,
                variant: 'ghost',
                disabled: props.disabled,
                onClick: toggle,
              })
            : null,
        ],
      )
    }
  },
})
