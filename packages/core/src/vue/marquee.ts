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
import { createMotionSurface, type MotionControlledPlayback } from '../experimental.js'
import { validateCards } from '../creative-controls.js'
import { marqueeProps } from './creative-props.js'
import type { CreativeUI } from './creative-controls.js'

export const marqueeHostProps = { moving: Boolean }
export function createMarquee(
  ui: CreativeUI & { MarqueeHost: Component },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MMarquee',
    inheritAttrs: false,
    props: marqueeProps,
    emits: { 'update:paused': (_paused: boolean) => true },
    setup(props, { attrs, emit }) {
      const surface = markRaw(createMotionSurface())
      const environment = ref({ reduced: true, paused: true, width: 0 })
      const requested = ref(props.autoplay),
        failed = ref(false),
        available = ref(false)
      const distance = computed(() => props.items.length * (props.itemWidth + props.gap))
      const moving = computed(
        () =>
          requested.value && !environment.value.reduced && !failed.value && props.items.length > 0,
      )
      const running = computed(() => moving.value && !props.paused && !environment.value.paused)
      let playback: MotionControlledPlayback | undefined,
        generation = 0
      function stop() {
        generation++
        playback?.stop()
        playback = undefined
      }
      function cycle(progress = 0) {
        if (!available.value || !moving.value) return
        const token = generation,
          start = Date.now()
        const [from, to] = props.direction === 'left' ? [0, -distance.value] : [-distance.value, 0]
        playback = surface.animate(
          { x: [from, to] },
          { type: 'tween', duration: (distance.value / props.speed) * 1000, ease: 'linear' },
        )
        if (progress > 0) playback.progress = progress
        if (!running.value) playback.pause()
        else if (playback.paused) playback.resume()
        void playback.finished.then((completed) => {
          if (token !== generation || !completed) return
          // A disabled backend can finish immediately. Do not spin a microtask loop.
          if (Date.now() - start < 16) {
            failed.value = true
            return
          }
          cycle()
        })
      }
      function rebuild() {
        // Cloning or wrapping items changes the transform origin. Refresh Jolt's
        // geometry after Vue patches, before stopping or starting its playback.
        if (available.value) surface.refresh()
        const progress = playback?.progress ?? 0
        stop()
        if (moving.value) cycle(progress)
        else if (surface.available) surface.set({ x: 0 })
      }
      onScopeDispose(
        surface.use(() => {
          surface.set({ x: 0 })
          available.value = true
          rebuild()
          return () => {
            available.value = false
            stop()
          }
        }),
      )
      watch(
        () => props.autoplay,
        (value) => {
          requested.value = value
        },
      )
      watch(
        () => [distance.value, props.speed, props.direction, moving.value, environment.value.width],
        rebuild,
        {
          flush: 'post',
        },
      )
      watch(running, (run) => {
        if (!available.value || !playback) return
        if (run) playback.resume()
        else playback.pause()
      })
      onScopeDispose(stop)
      return () => {
        validateCards(props.items.map((item) => ({ id: item.id, title: item.label })))
        if (
          !Number.isFinite(props.speed) ||
          props.speed <= 0 ||
          props.speed > 500 ||
          !Number.isFinite(props.itemWidth) ||
          props.itemWidth < 80 ||
          !Number.isFinite(props.gap) ||
          props.gap < 0
        )
          throw new RangeError(
            'Marquee requires speed in (0, 500], itemWidth >= 80 and a nonnegative gap.',
          )
        const copies = moving.value
          ? Math.max(2, Math.ceil(environment.value.width / Math.max(1, distance.value)) + 1)
          : 1
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'sm',
            ...(platform === 'web'
              ? { class: 'm-marquee', role: 'region', 'aria-label': props.label }
              : { accessibilityLabel: props.label }),
          }),
          {
            default: () => [
              h(
                ui.Row,
                { gap: 'sm', justify: 'between', wrap: true },
                {
                  default: () => [
                    h(ui.Text, { text: props.label, variant: 'heading' }),
                    h(ui.Button, {
                      text: requested.value && !props.paused ? props.pauseLabel : props.playLabel,
                      variant: 'ghost',
                      size: 'sm',
                      disabled: environment.value.reduced || !props.items.length,
                      onClick: () => {
                        const next = !requested.value || props.paused
                        requested.value = next
                        failed.value = false
                        emit('update:paused', !next)
                      },
                    }),
                  ],
                },
              ),
              h(
                ui.MarqueeHost,
                {
                  moving: moving.value,
                  onEnvironment: (value: typeof environment.value) => {
                    environment.value = value
                  },
                },
                {
                  default: () =>
                    h(
                      ui.Box,
                      {
                        id: props.id ? `${props.id}-track` : undefined,
                        motionSurface: surface,
                        ...(platform === 'web'
                          ? {
                              style: {
                                width: moving.value ? `${distance.value * copies}px` : '100%',
                              },
                            }
                          : {
                              width: moving.value ? distance.value * copies : '100%',
                              horizontalAlignment: 'left',
                            }),
                      },
                      {
                        default: () =>
                          h(
                            ui.Row,
                            {
                              gap: props.gap,
                              wrap: !moving.value,
                              ...(platform === 'web' ? { role: 'list' } : {}),
                            },
                            {
                              default: () =>
                                Array.from({ length: copies }, (_, copy) =>
                                  props.items.map((item) =>
                                    h(
                                      ui.Card,
                                      {
                                        key: `${copy}:${typeof item.id}:${item.id}`,
                                        width: props.itemWidth,
                                        padding: 'md',
                                        accessibilityHidden: copy > 0,
                                        ...(platform === 'web'
                                          ? {
                                              role: 'listitem',
                                              inert: copy > 0 || undefined,
                                              style: { flexShrink: 0 },
                                            }
                                          : {}),
                                      },
                                      {
                                        default: () =>
                                          h(
                                            ui.Column,
                                            { gap: 'sm' },
                                            {
                                              default: () => [
                                                item.image
                                                  ? h(ui.Image, {
                                                      src: item.image,
                                                      alt: '',
                                                      height: 64,
                                                      fit: 'contain',
                                                    })
                                                  : null,
                                                h(ui.Text, {
                                                  text: item.label,
                                                  variant: 'heading',
                                                }),
                                              ],
                                            },
                                          ),
                                      },
                                    ),
                                  ),
                                ),
                            },
                          ),
                      },
                    ),
                },
              ),
            ],
          },
        )
      }
    },
  })
}
