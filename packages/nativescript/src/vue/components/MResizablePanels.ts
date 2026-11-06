import { computed, defineComponent, h, mergeProps, ref, watch } from 'nativescript-vue'
import type { EventData, PanGestureEventData, View } from '@nativescript/core'
import { panelValue, positiveSize } from '@getcortexlabs/mavis-core'
import { resizablePanelsProps, usePartition, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useAnimatedNumber } from '../animated-number.js'
import { MColumn, MRow, MBox } from './layout.js'
import { MSlider } from './MSlider.js'
import { MButton } from './MButton.js'

export const MResizablePanels = defineComponent({
  name: 'MResizablePanels',
  inheritAttrs: false,
  props: resizablePanelsProps,
  emits: { 'update:modelValue': (_value: number) => true, resize: (_value: number) => true },
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const size = ref({ width: 0, height: 0 })
    const value = computed(() =>
      panelValue(props.modelValue, props.min, props.max, props.collapsible),
    )
    let remembered = Math.max(props.min, 40),
      origin = 0
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
    const motion = useAnimatedNumber(
      () => value.value,
      () => state.dragging.value,
    )
    const vertical = () => props.orientation === 'vertical'
    function finish() {
      state.end()
      const closest = props.snap
        .filter((p) => Number.isFinite(p) && p >= props.min && p <= props.max)
        .sort((a, b) => Math.abs(a - value.value) - Math.abs(b - value.value))[0]
      if (closest !== undefined && Math.abs(closest - value.value) <= 3)
        emit('update:modelValue', closest)
      emit(
        'resize',
        closest !== undefined && Math.abs(closest - value.value) <= 3 ? closest : value.value,
      )
    }
    function toggle() {
      if (props.disabled || !props.collapsible) return
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
      const ratio = Math.max(0, Math.min(100, motion.shown.value)),
        flipped = !vertical() && props.direction === 'rtl'
      const first = flipped ? 100 - ratio : ratio,
        last = flipped ? ratio : 100 - ratio
      const tracks = `${first}*,44,${last}*`
      return h(MColumn, mergeProps(attrs, { gap: 'sm' }), () => [
        h(
          'GridLayout',
          {
            onLoaded: motion.onLoaded,
            onUnloaded: motion.onUnloaded,
            height: positiveSize(props.height, 'height'),
            columns: vertical() ? '*' : tracks,
            rows: vertical() ? tracks : '*',
            clipToBounds: true,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.value.colors.border,
            onLayoutChanged: (event: EventData) => {
              const next = (event.object as View).getActualSize()
              if (next.width !== size.value.width || next.height !== size.value.height) {
                state.cancel()
                size.value = next
              }
            },
          },
          [
            h(
              'ScrollView',
              {
                row: vertical() ? 0 : 0,
                col: flipped ? 2 : 0,
                visibility: value.value === 0 ? 'hidden' : 'visible',
                accessibilityLabel: props.primaryLabel,
              },
              [h(MColumn, {}, () => slots.primary?.())],
            ),
            h(
              MBox,
              {
                row: vertical() ? 1 : 0,
                col: vertical() ? 0 : 1,
                backgroundColor: theme.value.colors.elevated,
                accessibilityHidden: true,
                onPan: (event: PanGestureEventData) => {
                  const travel = (vertical() ? size.value.height : size.value.width) - 44
                  if (props.disabled || travel <= 0) return
                  if (event.state === 1) {
                    if (state.begin()) origin = value.value
                  }
                  if (event.state === 2 && state.dragging.value)
                    state.update(
                      origin +
                        ((vertical() ? event.deltaY : event.deltaX * (flipped ? -1 : 1)) / travel) *
                          100,
                    )
                  if (event.state === 3 && state.dragging.value) finish()
                  if (event.state === 4) state.cancel()
                },
              },
              () =>
                h(MBox, {
                  width: vertical() ? 28 : 4,
                  height: vertical() ? 4 : 28,
                  radius: 'full',
                  backgroundColor: theme.value.colors.muted,
                  horizontalAlignment: 'center',
                  verticalAlignment: 'middle',
                }),
            ),
            h(
              'ScrollView',
              {
                row: vertical() ? 2 : 0,
                col: vertical() ? 0 : flipped ? 0 : 2,
                accessibilityLabel: props.secondaryLabel,
              },
              [h(MColumn, {}, () => slots.secondary?.())],
            ),
          ],
        ),
        h(MSlider, {
          label: props.label,
          modelValue: value.value,
          min: props.collapsible ? 0 : props.min,
          max: props.max,
          step: props.step,
          disabled: props.disabled,
          'onUpdate:modelValue': state.update,
        }),
        h(MRow, { gap: 'sm' }, () => [
          h(MButton, {
            text: '−',
            variant: 'ghost',
            accessibilityLabel: `${props.primaryLabel}: −${props.step}%`,
            disabled: props.disabled || value.value <= props.min,
            onClick: () => state.update(value.value - props.step),
          }),
          h(MButton, {
            text: '+',
            variant: 'ghost',
            accessibilityLabel: `${props.primaryLabel}: +${props.step}%`,
            disabled: props.disabled || value.value >= props.max,
            onClick: () => state.update(value.value + props.step),
          }),
          props.collapsible
            ? h(MButton, {
                text: value.value ? props.collapseLabel : props.expandLabel,
                variant: 'ghost',
                disabled: props.disabled,
                onClick: toggle,
              })
            : null,
        ]),
      ])
    }
  },
})
