import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  onScopeDispose,
  ref,
  watch,
} from '@vue/runtime-core'
import { createMotionSurface, type MotionDrag, type MotionPlayback } from '../experimental.js'
import {
  deckDecision,
  validateCards,
  type SwipeCard,
  type SwipeDecision,
} from '../creative-controls.js'
import { swipeDeckProps } from './creative-props.js'
import type { CreativeUI } from './creative-controls.js'
import type { ChoiceValue } from '../choice.js'
import { useMavisTheme } from './theme.js'
import { componentMotion } from '../motion.js'

export function createSwipeDeck(ui: CreativeUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MSwipeDeck',
    inheritAttrs: false,
    props: swipeDeckProps,
    emits: {
      'update:modelValue': (_id: ChoiceValue | null) => true,
      decide: (_event: { item: SwipeCard; decision: SwipeDecision }) => true,
      undo: () => true,
    },
    setup(props, { attrs, slots, emit }) {
      const { theme } = useMavisTheme()
      const surface = markRaw(createMotionSurface())
      const busy = ref(false)
      const index = computed(() =>
        validateCards(props.items).findIndex((item) => item.id === props.modelValue),
      )
      const item = computed(() => props.items[index.value])
      let drag: MotionDrag | undefined,
        playback: MotionPlayback | undefined,
        revision = 0
      function reset() {
        revision++
        busy.value = false
        playback?.stop()
        if (surface.available) {
          drag?.cancel()
          surface.set({ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 })
          if (!props.disabled) drag?.resume()
        }
      }
      function settle() {
        if (surface.available) {
          if (props.animated)
            surface.animate({ x: 0, rotate: 0 }, componentMotion(theme.value, 'selection'))
          else surface.set({ x: 0, rotate: 0 })
        }
      }
      async function decide(decision: SwipeDecision) {
        const current = item.value
        if (props.disabled || busy.value || !current) return
        busy.value = true
        const token = ++revision,
          next = props.items[index.value + 1]?.id ?? null
        drag?.pause()
        if (surface.available && props.animated) {
          playback = surface.animate(
            {
              x: decision === 'accept' ? 340 : -340,
              rotate: decision === 'accept' ? 14 : -14,
              opacity: 0,
            },
            { duration: 220, ease: 'easeIn' },
          )
          await playback.finished
        }
        if (token !== revision || props.disabled || item.value?.id !== current.id) return
        emit('decide', { item: current, decision })
        emit('update:modelValue', next)
        await nextTick()
        if (token === revision) {
          busy.value = false
          drag?.resume()
          settle()
          if (surface.available) surface.set({ opacity: 1 })
        }
      }
      onScopeDispose(
        surface.use((owner) => {
          const stop = watch(
            () => [props.disabled, props.threshold],
            () => {
              drag?.dispose()
              drag = undefined
              if (!Number.isFinite(props.threshold) || props.threshold <= 0)
                throw new RangeError('Swipe threshold must be positive.')
              if (props.disabled) {
                reset()
                return
              }
              drag = owner.drag({
                axis: 'x',
                bounds: { left: -360, right: 360 },
                onRelease: (event) => {
                  const decision = deckDecision(event.x, event.velocityX, props.threshold)
                  void nextTick(() => {
                    if (decision) void decide(decision)
                    else settle()
                  })
                },
              })
            },
            { immediate: true },
          )
          return () => {
            revision++
            busy.value = false
            playback?.stop()
            stop()
            drag?.dispose()
            drag = undefined
          }
        }),
      )
      watch(() => [props.modelValue, props.items], reset, { flush: 'post' })
      onScopeDispose(() => {
        revision++
        playback?.stop()
      })
      return () => {
        if (!Number.isFinite(props.height) || props.height < 180)
          throw new RangeError('Swipe deck height must be at least 180.')
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'md',
            ...(platform === 'web'
              ? { role: 'region', 'aria-label': props.label, class: 'm-swipe-deck' }
              : { accessibilityLabel: props.label }),
          }),
          {
            default: () => [
              h(ui.Text, { text: props.label, variant: 'heading' }),
              h(
                ui.Box,
                {
                  height: props.height + 20,
                  ...(platform === 'web'
                    ? { style: { display: 'grid', overflow: 'hidden', touchAction: 'pan-y' } }
                    : { clipToBounds: true }),
                },
                {
                  default: () =>
                    item.value
                      ? [
                          ...[2, 1]
                            .filter((depth) => props.items[index.value + depth])
                            .map((depth) =>
                              h(ui.Box, {
                                key: depth,
                                backgroundColor:
                                  depth === 1
                                    ? theme.value.colors.primarySoft
                                    : theme.value.colors.elevated,
                                radius: 'lg',
                                margin: depth * 8,
                                height: props.height,
                                accessibilityHidden: true,
                                ...(platform === 'web'
                                  ? {
                                      style: {
                                        gridArea: '1 / 1',
                                        transform: `translateY(${depth * 6}px)`,
                                      },
                                    }
                                  : { translateY: depth * 6 }),
                              }),
                            ),
                          h(
                            ui.Card,
                            {
                              key: 'active',
                              id: props.id ? `${props.id}-card` : undefined,
                              motionSurface: surface,
                              padding: 'lg',
                              height: props.height,
                              radius: 'lg',
                              ...(platform === 'web'
                                ? {
                                    style: {
                                      gridArea: '1 / 1',
                                      userSelect: 'none',
                                      touchAction: 'pan-y',
                                    },
                                  }
                                : {}),
                            },
                            {
                              default: () =>
                                slots.item?.({ item: item.value, index: index.value }) ??
                                h(
                                  ui.Column,
                                  { gap: 'md' },
                                  {
                                    default: () => [
                                      item.value!.image
                                        ? h(ui.Image, {
                                            src: item.value!.image,
                                            alt: '',
                                            height: Math.max(80, props.height - 180),
                                            width: '100%',
                                            fit: 'cover',
                                            radius: 'md',
                                          })
                                        : null,
                                      h(ui.Text, { text: item.value!.title, variant: 'title' }),
                                      h(ui.Text, { text: item.value!.description, tone: 'muted' }),
                                    ],
                                  },
                                ),
                            },
                          ),
                        ]
                      : [h(ui.Text, { text: props.emptyLabel, variant: 'heading' })],
                },
              ),
              h(
                ui.Row,
                { gap: 'sm', wrap: true },
                {
                  default: () => [
                    h(ui.Button, {
                      text: props.rejectLabel,
                      icon: 'x',
                      variant: 'secondary',
                      disabled: props.disabled || busy.value || !item.value,
                      onClick: () => void decide('reject'),
                    }),
                    h(ui.Button, {
                      text: props.acceptLabel,
                      icon: 'check',
                      disabled: props.disabled || busy.value || !item.value,
                      onClick: () => void decide('accept'),
                    }),
                    h(ui.Button, {
                      text: props.undoLabel,
                      icon: 'undo-2',
                      variant: 'ghost',
                      disabled: props.disabled || busy.value || !props.canUndo,
                      onClick: () => {
                        if (!props.disabled && !busy.value && props.canUndo) emit('undo')
                      },
                    }),
                  ],
                },
              ),
              h(ui.Text, {
                text: item.value
                  ? `${index.value + 1} / ${props.items.length} · ${item.value.title}`
                  : props.emptyLabel,
                variant: 'caption',
                ...(platform === 'web'
                  ? { role: 'status', 'aria-live': 'polite' }
                  : { accessibilityLiveRegion: 'polite' }),
              }),
            ],
          },
        )
      }
    },
  })
}
