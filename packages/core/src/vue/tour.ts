import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  nextTick,
  onMounted,
  onScopeDispose,
  provide,
  reactive,
  ref,
  watch,
  type Component,
  type InjectionKey,
} from '@vue/runtime-core'
import { validateTour, type TourStep } from '../creative-controls.js'
import { tourProps, tourTargetProps } from './creative-props.js'
import { useComponentState } from './component-motion.js'
import { useMavisTheme } from './theme.js'

interface TourContext {
  current(): TourStep | undefined
  register(id: string): () => void
  panel(): ReturnType<typeof h>
  close(reason: string): void
  animated(): boolean
}
const tourKey: InjectionKey<TourContext> = Symbol('mavis-tour')
export const tourHostProps = { active: Boolean, restoreFocus: { type: Boolean, default: true } }
export function createTour(
  ui: {
    Column: Component
    Row: Component
    Box: Component
    Text: Component
    Button: Component
    Popover: Component
    Host: Component
    TargetHost: Component
  },
  platform: 'web' | 'native',
) {
  const MTour = defineComponent({
    name: 'MTour',
    inheritAttrs: false,
    props: tourProps,
    emits: {
      'update:modelValue': (_id: string | null) => true,
      finish: (_reason: string) => true,
      missing: (_id: string) => true,
    },
    setup(props, { attrs, slots, emit }) {
      const targets = reactive(new Set<string>())
      const index = computed(() =>
        validateTour(props.steps).findIndex((step) => step.id === props.modelValue),
      )
      const step = computed(() => props.steps[index.value])
      let mounted = false,
        generation = 0
      const closeReason = ref('')
      watch(
        () => props.modelValue,
        (value) => {
          if (value !== null) closeReason.value = ''
        },
      )
      function close(reason: string) {
        if (props.modelValue === null) return
        closeReason.value = reason
        emit('update:modelValue', null)
        emit('finish', reason)
      }
      function move(direction: number) {
        for (let i = index.value + direction; i >= 0 && i < props.steps.length; i += direction) {
          const next = props.steps[i]!
          if (targets.has(next.id)) {
            emit('update:modelValue', next.id)
            return
          }
          emit('missing', next.id)
        }
        close(direction > 0 ? 'complete' : 'missing')
      }
      async function check() {
        const token = ++generation
        await nextTick()
        if (!mounted || token !== generation || props.modelValue === null) return
        if (!step.value || !targets.has(step.value.id)) {
          emit('missing', props.modelValue)
          move(1)
        }
      }
      provide(tourKey, {
        current: () => step.value,
        animated: () => props.animated,
        register(id) {
          if (!id.trim() || targets.has(id))
            throw new TypeError('Tour target names must be nonempty and unique within a tour.')
          targets.add(id)
          return () => targets.delete(id)
        },
        close,
        panel: () =>
          h(
            ui.Column,
            { gap: 'md' },
            {
              default: () => [
                h(ui.Text, {
                  text: `${props.label} · ${index.value + 1} / ${props.steps.length}`,
                  variant: 'caption',
                  tone: 'muted',
                }),
                h(ui.Text, { text: step.value?.title, variant: 'heading' }),
                h(ui.Text, { text: step.value?.description }),
                h(
                  ui.Row,
                  { gap: 'xs', wrap: true },
                  {
                    default: () => [
                      h(ui.Button, {
                        text: props.backLabel,
                        variant: 'secondary',
                        disabled: index.value <= 0,
                        onClick: () => move(-1),
                      }),
                      h(ui.Button, {
                        text:
                          index.value === props.steps.length - 1
                            ? props.finishLabel
                            : props.nextLabel,
                        onClick: () => move(1),
                      }),
                      h(ui.Button, {
                        text: props.skipLabel,
                        variant: 'ghost',
                        onClick: () => close('skip'),
                      }),
                    ],
                  },
                ),
              ],
            },
          ),
      })
      watch(() => [props.modelValue, props.steps, [...targets]], check, {
        flush: 'post',
        deep: true,
      })
      onMounted(() => {
        mounted = true
        void check()
      })
      onScopeDispose(() => {
        mounted = false
        generation++
      })
      return () =>
        h(
          ui.Host,
          mergeProps(attrs, {
            id: props.id,
            active: props.modelValue !== null,
            restoreFocus: closeReason.value !== 'outside',
            ...(platform === 'web' ? { class: 'm-tour' } : {}),
          }),
          slots,
        )
    },
  })
  const MTourTarget = defineComponent({
    name: 'MTourTarget',
    inheritAttrs: false,
    props: tourTargetProps,
    setup(props, { attrs, slots }) {
      const context = inject(tourKey)
      if (!context) throw new Error('MTourTarget must be inside MTour.')
      const { theme } = useMavisTheme()
      const active = computed(() => context.current()?.id === props.name)
      const surface = useComponentState(() => ({ opacity: active.value ? 1 : 0.55 }), 'selection')
      let release = () => {}
      watch(
        () => props.name,
        (name) => {
          release()
          release = context.register(name)
        },
        { immediate: true },
      )
      onScopeDispose(() => release())
      return () =>
        h(
          ui.TargetHost,
          mergeProps(attrs, {
            active: active.value,
            ...(platform === 'web'
              ? { class: 'm-tour-target', 'data-tour-target': props.name }
              : {}),
          }),
          {
            default: () =>
              h(
                ui.Popover,
                {
                  open: active.value,
                  label: context.current()?.title ?? props.name,
                  triggerLabel: props.name,
                  width: 320,
                  onClose: (reason: string) => {
                    if (active.value) context.close(reason)
                  },
                },
                {
                  anchor: () =>
                    h(
                      ui.Box,
                      {
                        padding: 'xs',
                        radius: 'md',
                        borderWidth: 2,
                        borderColor: active.value ? theme.value.colors.primary : 'transparent',
                      },
                      { default: () => slots.default?.({ active: active.value }) },
                    ),
                  default: () =>
                    h(
                      ui.Column,
                      { motionSurface: context.animated() ? surface : undefined, gap: 'sm' },
                      { default: () => context.panel() },
                    ),
                },
              ),
          },
        )
    },
  })
  return { MTour, MTourTarget }
}
