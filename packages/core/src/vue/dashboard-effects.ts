import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onScopeDispose,
  ref,
  watch,
} from '@vue/runtime-core'
import { dashboardNumber, effectColors } from '../dashboard.js'
import {
  createMotionSurface,
  type MotionDecoration,
  type MotionGradient,
  type MotionPlayback,
} from '../experimental.js'
import { componentMotion } from '../motion.js'
import { confettiProps, gradientBackgroundProps, particleFieldProps } from './dashboard-props.js'
import type { DashboardUI } from './dashboard-charts.js'
import { useMavisTheme } from './theme.js'

export interface DashboardEnvironment {
  reduced: boolean
  paused: boolean
}
export function createDashboardEffects(ui: DashboardUI, platform: 'web' | 'native') {
  const MGradientBackground = defineComponent({
    name: 'MGradientBackground',
    inheritAttrs: false,
    props: gradientBackgroundProps,
    setup(props, { attrs, slots }) {
      const { theme } = useMavisTheme(),
        surface = markRaw(createMotionSurface()),
        environment = ref<DashboardEnvironment>({ reduced: true, paused: true })
      let gradient: MotionGradient | undefined,
        playback: MotionPlayback | undefined,
        generation = 0
      const running = computed(
        () =>
          props.active && props.animated && !environment.value.reduced && !environment.value.paused,
      )
      function stop() {
        generation++
        playback?.stop()
        playback = undefined
        gradient?.stop()
      }
      function loop(angle: number) {
        if (!running.value || !gradient) return
        const token = generation,
          started = Date.now()
        playback = gradient.animate(
          { angle: angle + 180 },
          { type: 'tween', duration: props.duration, ease: 'linear' },
        )
        void playback.finished.then((done) => {
          if (done && token === generation && Date.now() - started > 16) loop(angle + 180)
        })
      }
      function update() {
        stop()
        if (!gradient) return
        const values = {
          colors: effectColors(props.colors),
          angle: dashboardNumber(props.angle, -36000, 36000, 'angle'),
        }
        if (props.animated && !environment.value.reduced && !environment.value.paused)
          gradient.animate(values, componentMotion(theme.value, 'data'))
        else gradient.set(values)
        if (running.value) loop(props.angle)
      }
      onScopeDispose(
        surface.use((owner) => {
          if (!owner.supports('gradient')) return
          gradient = owner.gradient({
            type: 'linear',
            colors: effectColors(props.colors),
            angle: props.angle,
          })
          update()
          return () => {
            stop()
            gradient?.dispose()
            gradient = undefined
          }
        }),
      )
      watch(
        () => [
          props.colors,
          props.angle,
          props.duration,
          props.animated,
          running.value,
          environment.value,
        ],
        update,
        { deep: true },
      )
      return () => {
        dashboardNumber(props.height, 40, 1600, 'height')
        dashboardNumber(props.duration, 1000, 120000, 'duration')
        effectColors(props.colors)
        return h(
          ui.Environment,
          {
            onEnvironment: (value: DashboardEnvironment) => {
              environment.value = value
            },
          },
          () =>
            h(
              ui.Box,
              mergeProps(attrs, {
                id: props.id,
                height: props.height,
                width: '100%',
                radius: props.radius,
                motionSurface: surface,
                backgroundColor: props.colors[0],
                ...(platform === 'web'
                  ? {
                      class: 'm-gradient-background',
                      style: {
                        overflow: 'hidden',
                        backgroundImage: `linear-gradient(${props.angle}deg, ${props.colors.join(', ')})`,
                      },
                    }
                  : { clipToBounds: true }),
              }),
              slots.default,
            ),
        )
      }
    },
  })
  const MParticleField = defineComponent({
    name: 'MParticleField',
    inheritAttrs: false,
    props: particleFieldProps,
    setup(props, { attrs, slots }) {
      const surface = markRaw(createMotionSurface()),
        environment = ref<DashboardEnvironment>({ reduced: true, paused: true })
      let decoration: MotionDecoration | undefined
      function stop() {
        decoration?.dispose()
        decoration = undefined
      }
      function update() {
        stop()
        if (
          !surface.available ||
          !surface.supports('particles') ||
          !props.active ||
          environment.value.reduced ||
          environment.value.paused
        )
          return
        decoration = surface.particles({
          colors: props.colors,
          rate: props.density,
          velocity: props.speed,
          lifetime: props.lifetime,
          duration: props.duration,
          size: props.size,
          shape: props.shape,
          source: 'bottom',
          angle: -90,
          spread: 80,
          gravity: 0,
          fadeOut: true,
        })
      }
      onScopeDispose(
        surface.use(() => {
          update()
          return stop
        }),
      )
      watch(
        () => [
          props.active,
          props.colors,
          props.density,
          props.speed,
          props.lifetime,
          props.duration,
          props.size,
          props.shape,
          environment.value,
        ],
        update,
        { deep: true },
      )
      return () => {
        dashboardNumber(props.height, 40, 1600, 'height')
        dashboardNumber(props.density, 1, 60, 'density')
        dashboardNumber(props.speed, 0, 300, 'speed')
        dashboardNumber(props.lifetime, 100, 5000, 'lifetime')
        dashboardNumber(props.size, 1, 24, 'size')
        effectColors(props.colors)
        if (props.duration !== undefined) dashboardNumber(props.duration, 100, 60000, 'duration')
        return h(
          ui.Environment,
          {
            onEnvironment: (value: DashboardEnvironment) => {
              environment.value = value
            },
          },
          () =>
            h(
              ui.Box,
              mergeProps(attrs, {
                id: props.id,
                height: props.height,
                width: '100%',
                radius: props.radius,
                motionSurface: surface,
                backgroundColor: props.backgroundColor,
                ...(platform === 'web'
                  ? { class: 'm-particle-field', style: { overflow: 'hidden' } }
                  : { clipToBounds: true }),
              }),
              slots.default,
            ),
        )
      }
    },
  })
  const MConfetti = defineComponent({
    name: 'MConfetti',
    inheritAttrs: false,
    props: confettiProps,
    emits: {
      burst: () => true,
      skipped: (_reason: 'disabled' | 'reduced-motion' | 'unavailable') => true,
    },
    setup(props, { attrs, slots, emit, expose }) {
      const surface = markRaw(createMotionSurface()),
        environment = ref<DashboardEnvironment>({ reduced: true, paused: true })
      let decoration: MotionDecoration | undefined
      function stop() {
        decoration?.dispose()
        decoration = undefined
      }
      function burst() {
        stop()
        const reason = props.disabled
          ? 'disabled'
          : environment.value.reduced
            ? 'reduced-motion'
            : environment.value.paused || !surface.available || !surface.supports('confetti')
              ? 'unavailable'
              : null
        if (reason) {
          emit('skipped', reason)
          return
        }
        decoration = surface.confetti({
          count: dashboardNumber(props.count, 1, 180, 'count'),
          colors: effectColors(props.colors),
        })
        emit('burst')
      }
      expose({ burst, stop })
      onScopeDispose(surface.use(() => stop))
      // Initial token and hydration do not celebrate. Only an explicit subsequent request does.
      watch(() => props.trigger, burst)
      watch(
        () => [props.disabled, environment.value],
        () => {
          if (props.disabled || environment.value.reduced || environment.value.paused) stop()
        },
        { deep: true },
      )
      return () => {
        dashboardNumber(props.count, 1, 180, 'count')
        effectColors(props.colors)
        return h(
          ui.Environment,
          {
            interactive: true,
            onEnvironment: (value: DashboardEnvironment) => {
              environment.value = value
            },
          },
          () =>
            h(
              ui.Box,
              mergeProps(attrs, {
                id: props.id,
                width: '100%',
                motionSurface: surface,
                ...(platform === 'web' ? { class: 'm-confetti' } : {}),
              }),
              slots.default,
            ),
        )
      }
    },
  })
  return { MGradientBackground, MParticleField, MConfetti }
}
