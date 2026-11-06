import {
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  onScopeDispose,
  ref,
  watch,
  type Component,
  type PropType,
} from '@vue/runtime-core'
import {
  createMotionRegion,
  createMotionScrollSource,
  createMotionSurface,
  whenMotionAvailable,
  type MotionHeader,
  type MotionRefreshContext,
} from '../experimental.js'
import { collapsibleHeaderProps, refreshControlProps } from './screen-component-props.js'
import type { RefreshState } from '../screen-components.js'
import { useMavisTheme } from './theme.js'
import { useCachedActivity } from './cached-activity.js'

export const scrollFrameHostProps = {
  source: {
    type: Object as PropType<ReturnType<typeof createMotionScrollSource>>,
    required: true as const,
  },
  region: {
    type: Object as PropType<ReturnType<typeof createMotionRegion>>,
    required: true as const,
  },
  height: { type: Number, required: true as const },
  label: { type: String, required: true as const },
}
type UI = {
  Frame: Component
  Box: Component
  Row: Component
  Column: Component
  Text: Component
  Image: Component
  Button: Component
}

export function createScrollComponents(ui: UI, platform: 'web' | 'native') {
  const ScrollFrame = defineComponent({
    name: 'MScrollFrame',
    inheritAttrs: false,
    props: {
      ...collapsibleHeaderProps,
      ...refreshControlProps,
      title: String,
      label: String,
      refresh: refreshControlProps.refresh.type,
      refreshMode: Boolean,
    },
    emits: {
      back: () => true,
      stateChange: (_state: RefreshState) => true,
      error: (_error: unknown) => true,
    },
    setup(props, { slots, attrs, emit, expose }) {
      const { theme } = useMavisTheme()
      const active = useCachedActivity()
      const region = markRaw(createMotionRegion()),
        source = markRaw(createMotionScrollSource())
      const make = () => markRaw(createMotionSurface())
      const header = make(),
        artwork = make(),
        title = make(),
        toolbar = make(),
        toolbarTitle = make(),
        section = make()
      const state = ref<RefreshState>('idle'),
        ready = ref(false)
      let control: MotionHeader | undefined,
        request: AbortController | undefined,
        revision = 0
      const setState = (value: RefreshState) => {
        if (state.value !== value) {
          state.value = value
          emit('stateChange', value)
        }
      }
      const cancel = () => {
        revision++
        request?.abort()
        request = undefined
        control?.cancelRefresh()
        if (state.value === 'refreshing') setState('idle')
      }
      const refresh = async (context: MotionRefreshContext) => {
        if (!props.refresh || props.disabled || !active.value) return
        const current = ++revision,
          abort = new AbortController()
        request?.abort()
        request = abort
        setState('refreshing')
        try {
          await props.refresh({
            signal: abort.signal,
            get cancelled() {
              return abort.signal.aborted || context.cancelled || current !== revision
            },
            commit: async (change) => {
              if (abort.signal.aborted || current !== revision) return false
              return context.commit(async () => {
                if (!abort.signal.aborted && current === revision) {
                  await change()
                  await nextTick()
                }
              })
            },
          })
          if (current === revision && !context.cancelled && !abort.signal.aborted)
            setState('success')
        } catch (error) {
          if (current === revision && !context.cancelled && !abort.signal.aborted) {
            setState('error')
            emit('error', error)
            throw error
          }
        } finally {
          if (request === abort) request = undefined
        }
      }
      const expanded = () => (props.refreshMode ? 104 : props.expandedHeight)
      const minimum = () => (props.refreshMode ? 56 : props.collapsedHeight)
      let release: (() => void) | undefined
      function bind() {
        release?.()
        release = undefined
        if (!active.value) return
        release = whenMotionAvailable(
          [region, source, header, artwork, title, toolbar, toolbarTitle, section],
          () => {
            const owned = region.scrollHeader(source, {
              header,
              artwork,
              title,
              toolbar,
              toolbarTitle,
              section,
              expanded: expanded(),
              minimum: minimum(),
              parallax: props.refreshMode ? 0 : (expanded() - minimum()) * props.parallax,
              items: () => [],
              onRefresh: props.refresh ? refresh : undefined,
              onRefreshError: () => {},
              refreshThreshold: props.threshold,
            })
            control = owned
            ready.value = true
            if (props.disabled) owned.pause()
            return () => {
              cancel()
              owned.dispose()
              if (control === owned) control = undefined
              ready.value = false
            }
          },
        )
      }
      watch(
        () => [
          active.value,
          props.expandedHeight,
          props.collapsedHeight,
          props.sectionHeight,
          props.height,
          props.parallax,
          props.refresh,
          props.threshold,
        ],
        bind,
        { immediate: true, flush: 'post' },
      )
      watch(
        () => props.disabled,
        (disabled) => {
          if (disabled) {
            cancel()
            control?.pause()
          } else control?.play()
        },
      )
      onScopeDispose(() => {
        release?.()
        cancel()
      })
      expose({
        refresh: () => control?.refresh() ?? Promise.resolve(false),
        cancel,
        scrollToTop: (animated = true) => control?.scrollToTop(animated),
      })
      return () => {
        if (
          !Number.isFinite(props.height) ||
          props.height <= 0 ||
          !(expanded() > minimum() && minimum() > 0) ||
          !Number.isFinite(expanded()) ||
          !Number.isFinite(minimum()) ||
          props.sectionHeight < 0 ||
          !Number.isFinite(props.sectionHeight) ||
          props.parallax < 0 ||
          props.parallax > 1
        )
          throw new RangeError(
            'Scroll components require finite height, expandedHeight > collapsedHeight > 0, nonnegative sectionHeight and parallax between 0 and 1.',
          )
        const label = props.title ?? props.label ?? ''
        const overlay =
          platform === 'web'
            ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }
            : { verticalAlignment: 'top' }
        const pointer = platform === 'web' ? { pointerEvents: 'auto' } : {}
        const status =
          state.value === 'refreshing'
            ? props.refreshingLabel
            : state.value === 'error'
              ? props.errorLabel
              : state.value === 'success'
                ? props.successLabel
                : props.refreshLabel
        const refreshButton = () =>
          props.refresh
            ? h(ui.Button, {
                text:
                  state.value === 'refreshing'
                    ? props.cancelLabel
                    : state.value === 'error'
                      ? props.retryLabel
                      : props.refreshLabel,
                icon: state.value === 'refreshing' ? 'x' : 'refresh-cw',
                variant: 'ghost',
                size: 'sm',
                disabled: props.disabled || !ready.value,
                style: pointer,
                onClick: () => (state.value === 'refreshing' ? cancel() : control?.refresh()),
              })
            : null
        return h(
          ui.Frame,
          mergeProps(attrs, { id: props.id, region, source, height: props.height, label }),
          {
            default: () => [
              !ready.value
                ? h(ui.Box, {
                    height: expanded() + (props.refreshMode ? 36 : props.sectionHeight),
                    accessibilityHidden: true,
                  })
                : null,
              slots.default?.({ state: state.value, refresh: () => control?.refresh(), cancel }),
            ],
            overlay: () => [
              h(
                ui.Box,
                { motionSurface: header, height: expanded(), style: overlay },
                {
                  default: () => [
                    h(
                      ui.Box,
                      {
                        motionSurface: artwork,
                        height: expanded(),
                        backgroundColor: theme.value.colors.surface,
                      },
                      {
                        default: () =>
                          props.image
                            ? h(ui.Image, {
                                src: props.image,
                                alt: '',
                                decorative: true,
                                height: expanded(),
                                fit: 'cover',
                              })
                            : slots.artwork?.(),
                      },
                    ),
                    h(
                      ui.Column,
                      {
                        padding: 'lg',
                        justify: 'end',
                        gap: 'xs',
                        ...(props.image ? { backgroundColor: '#00000080' } : {}),
                      },
                      {
                        default: () => [
                          h(ui.Text, {
                            motionSurface: title,
                            text: label,
                            variant: props.refreshMode ? 'heading' : 'title',
                            ...(props.image ? { style: { color: '#ffffff' } } : {}),
                          }),
                          props.subtitle
                            ? h(ui.Text, {
                                text: props.subtitle,
                                tone: props.image ? undefined : 'muted',
                                ...(props.image ? { style: { color: '#ffffff' } } : {}),
                              })
                            : null,
                        ],
                      },
                    ),
                  ],
                },
              ),
              h(
                ui.Box,
                {
                  motionSurface: toolbar,
                  height: minimum(),
                  backgroundColor: theme.value.colors.surface,
                  style: overlay,
                },
                {
                  default: () =>
                    h(
                      ui.Row,
                      { align: 'center', justify: 'between', gap: 'sm', paddingX: 'sm' },
                      {
                        default: () => [
                          props.back
                            ? h(ui.Button, {
                                icon: 'arrow-left',
                                accessibilityLabel: props.backLabel,
                                variant: 'ghost',
                                size: 'sm',
                                style: pointer,
                                onClick: () => emit('back'),
                              })
                            : slots.leading?.(),
                          h(ui.Text, {
                            motionSurface: toolbarTitle,
                            text: label,
                            variant: 'heading',
                            shrink: 1,
                          }),
                          props.refresh
                            ? refreshButton()
                            : h(ui.Button, {
                                icon: 'arrow-up',
                                accessibilityLabel: props.topLabel,
                                variant: 'ghost',
                                size: 'sm',
                                style: pointer,
                                onClick: () => control?.scrollToTop(),
                              }),
                          slots.actions?.(),
                        ],
                      },
                    ),
                },
              ),
              h(
                ui.Box,
                {
                  motionSurface: section,
                  height: props.refreshMode ? 36 : props.sectionHeight,
                  backgroundColor: theme.value.colors.surface,
                  style: overlay,
                },
                {
                  default: () =>
                    props.refreshMode
                      ? h(ui.Text, {
                          text: status,
                          variant: 'caption',
                          tone: state.value === 'error' ? 'danger' : 'muted',
                          ...(platform === 'web'
                            ? {
                                role: 'status',
                                'aria-live': 'polite',
                                style: { padding: '6px 16px' },
                              }
                            : { accessibilityLiveRegion: 'polite', padding: 6 }),
                        })
                      : slots.section?.(),
                },
              ),
            ],
          },
        )
      }
    },
  })
  const MCollapsibleHeader = defineComponent({
    name: 'MCollapsibleHeader',
    inheritAttrs: false,
    props: collapsibleHeaderProps,
    emits: ['back'],
    setup(props, { attrs, slots, emit, expose }) {
      const inner = ref<{ scrollToTop(animated?: boolean): void }>()
      expose({ scrollToTop: (animated = true) => inner.value?.scrollToTop(animated) })
      return () =>
        h(ScrollFrame, mergeProps(attrs, props, { ref: inner, onBack: () => emit('back') }), slots)
    },
  })
  const MRefreshControl = defineComponent({
    name: 'MRefreshControl',
    inheritAttrs: false,
    props: refreshControlProps,
    emits: ['stateChange', 'error'],
    setup(props, { attrs, slots, emit, expose }) {
      const inner = ref<{ refresh(): Promise<boolean>; cancel(): void }>()
      expose({
        refresh: () => inner.value?.refresh() ?? Promise.resolve(false),
        cancel: () => inner.value?.cancel(),
      })
      return () =>
        h(
          ScrollFrame,
          mergeProps(attrs, props, {
            ref: inner,
            refreshMode: true,
            onStateChange: (s: RefreshState) => emit('stateChange', s),
            onError: (e: unknown) => emit('error', e),
          }),
          slots,
        )
    },
  })
  return { MCollapsibleHeader, MRefreshControl }
}
