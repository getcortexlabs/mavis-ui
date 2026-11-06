import type { CarouselComponent } from './discovery-components.js'
import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onScopeDispose,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import { choiceKey, type ChoiceValue } from '../choice.js'
import { collectionKeys } from '../discovery.js'
import { componentMotion } from '../motion.js'
import { createMotionSurface } from '../experimental.js'
import { carouselProps } from './discovery-props.js'
import { useMavisTheme } from './theme.js'

export function createCarousel(
  ui: {
    Column: Component
    Row: Component
    Box: Component
    Text: Component
    Button: Component
    gestures: (
      move: (direction: number) => void,
      direction: { value: number },
    ) => Record<string, unknown>
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MCarousel',
    inheritAttrs: false,
    props: carouselProps,
    emits: { 'update:modelValue': (_value: ChoiceValue) => true },
    setup(props, { attrs, slots, emit }) {
      const { theme } = useMavisTheme()
      const keys = computed(() => collectionKeys(props.items, props.itemKey))
      const index = computed(() =>
        Math.max(
          0,
          keys.value.findIndex((key) => key === props.modelValue),
        ),
      )
      const direction = ref(1)
      const surface = markRaw(createMotionSurface())
      const readingDirection = ref(1)
      let first = true
      onScopeDispose(
        surface.use((motion) => {
          if (!first)
            motion.animate(
              { x: [direction.value * readingDirection.value * 48, 0], opacity: [0.7, 1] },
              componentMotion(theme.value, 'layout'),
            )
          first = false
          const drag = motion.drag({
            axis: 'x',
            snap: { x: [0] },
            onRelease: ({ x, velocityX }) => {
              if (props.disabled) return
              const projected = x + velocityX * 0.12
              if (Math.abs(x) >= 40 || (Math.abs(x) >= 8 && Math.abs(projected) >= 60))
                move((projected < 0 ? 1 : -1) * readingDirection.value)
            },
          })
          const stop = watch(
            () => props.disabled || keys.value.length < 2,
            (disabled) => {
              if (disabled) {
                drag.cancel()
                drag.pause()
                motion.set({ x: 0 })
              } else drag.resume()
            },
            { immediate: true },
          )
          return stop
        }),
      )
      function choose(next: number) {
        if (props.disabled || next === index.value || !keys.value.length) return
        direction.value = next > index.value ? 1 : -1
        emit('update:modelValue', keys.value[next]!)
      }
      function move(amount: number) {
        const count = keys.value.length
        if (!count) return
        const next = props.loop
          ? (index.value + amount + count) % count
          : Math.max(0, Math.min(count - 1, index.value + amount))
        choose(next)
      }
      watch(index, (next, previous) => {
        direction.value = next > previous ? 1 : -1
      })
      const gestures = ui.gestures(move, readingDirection)
      return () =>
        h(
          ui.Column,
          mergeProps(
            { id: props.id, gap: 'md' },
            attrs,
            platform === 'web'
              ? {
                  class: 'm-carousel',
                  role: 'region',
                  'aria-roledescription': 'carousel',
                  'aria-label': props.label,
                }
              : {},
          ),
          () => [
            h(ui.Row, { justify: 'between', gap: 'md', wrap: true }, () => [
              h(ui.Text, { as: 'h2', text: props.label, variant: 'heading' }),
              h(ui.Text, {
                text: keys.value.length ? `${index.value + 1} / ${keys.value.length}` : '0 / 0',
                tone: 'muted',
                variant: 'caption',
                ...(platform === 'web'
                  ? { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }
                  : { accessibilityLiveRegion: 'polite' }),
              }),
            ]),
            keys.value.length
              ? h(
                  ui.Box,
                  mergeProps(
                    { radius: 'lg' },
                    gestures,
                    platform === 'web' ? { style: { overflow: 'clip', touchAction: 'pan-y' } } : {},
                  ),
                  () =>
                    h(
                      ui.Box,
                      {
                        key: choiceKey(keys.value[index.value]!),
                        motionSurface: surface,
                        ...(platform === 'web'
                          ? {
                              role: 'group',
                              'aria-roledescription': 'slide',
                              'aria-label': `${props.slideLabel} ${index.value + 1} / ${keys.value.length}`,
                            }
                          : {}),
                      },
                      () =>
                        slots.default?.({
                          item: props.items[index.value],
                          index: index.value,
                          itemKey: keys.value[index.value],
                        }),
                    ),
                )
              : (slots.empty?.() ?? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })),
            h(ui.Row, { justify: 'between', gap: 'sm' }, () => [
              h(ui.Button, {
                icon: 'arrow-left',
                variant: 'secondary',
                accessibilityLabel: props.previousLabel,
                disabled:
                  props.disabled || keys.value.length < 2 || (!props.loop && index.value === 0),
                onClick: () => move(-1),
              }),
              h(ui.Row, { gap: 'xs', wrap: true, justify: 'center', shrink: 1 }, () =>
                keys.value.map((key, n) =>
                  h(ui.Button, {
                    key: choiceKey(key),
                    text: String(n + 1),
                    variant: n === index.value ? 'primary' : 'ghost',
                    accessibilityLabel: `${props.slideLabel} ${n + 1}`,
                    disabled: props.disabled,
                    ...(platform === 'web'
                      ? { 'aria-current': n === index.value ? 'true' : undefined }
                      : {}),
                    onClick: () => choose(n),
                  }),
                ),
              ),
              h(ui.Button, {
                icon: 'arrow-right',
                variant: 'secondary',
                accessibilityLabel: props.nextLabel,
                disabled:
                  props.disabled ||
                  keys.value.length < 2 ||
                  (!props.loop && index.value === keys.value.length - 1),
                onClick: () => move(1),
              }),
            ]),
          ],
        )
    },
  }) as unknown as CarouselComponent
}
