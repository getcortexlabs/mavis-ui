import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
  useId,
  watch,
} from '@vue/runtime-core'
import { addCivilDays } from '../date.js'
import {
  schedulerOffset,
  schedulerLayout,
  schedulerInstant,
  schedulerCivilFromUTC,
  changeSchedulerEvent,
  type SchedulerClock,
  type SchedulerChange,
  type SchedulerEvent,
} from '../scheduler.js'
import { schedulerProps, type AdvancedGesture } from './advanced-props.js'
import { useComponentLayout } from './component-motion.js'
import { useMavisTheme } from './theme.js'
import type { AdvancedUI, AdvancedFocus } from './advanced-collections.js'
const time = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
export function createScheduler(ui: AdvancedUI, platform: 'web' | 'native', clock: SchedulerClock) {
  return defineComponent({
    name: 'MScheduler',
    inheritAttrs: false,
    props: schedulerProps,
    emits: {
      'update:modelValue': (_v: SchedulerEvent[]) => true,
      'update:date': (_v: string) => true,
      change: (_v: SchedulerChange) => true,
      error: (_v: string) => true,
      select: (_id: string) => true,
    },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme(),
        uid = useId(),
        host = ref<AdvancedFocus>(),
        selected = ref<string | null>(null),
        draft = ref<SchedulerChange>(),
        failure = ref(''),
        dragging = ref(false)
      let original: SchedulerEvent | undefined,
        kind: 'move' | 'resize' = 'move'
      const shown = computed(() =>
        draft.value ? changeSchedulerEvent(props.modelValue, draft.value) : props.modelValue,
      )
      const layout = computed(() =>
        schedulerLayout(
          shown.value,
          props.date,
          props.days,
          props.timeZone,
          clock,
          props.startHour,
          props.endHour,
        ),
      )
      const region = useComponentLayout(
        () => [shown.value, props.date, props.days, props.hourHeight],
        false,
        () => props.animated && !dragging.value,
      )
      const describe = (event: SchedulerEvent) =>
        `${event.title} · ${clock.parts(event.start, props.timeZone).date} ${time(clock.parts(event.start, props.timeZone).minute)}–${time(clock.parts(event.end, props.timeZone).minute)} · ${props.timeZone} ${schedulerOffset(event.start, props.timeZone, clock)} → ${schedulerOffset(event.end, props.timeZone, clock)}`
      function cancel() {
        draft.value = undefined
        original = undefined
        dragging.value = false
      }
      watch(
        () => [
          props.modelValue,
          props.date,
          props.days,
          props.timeZone,
          props.disabled,
          props.startHour,
          props.endHour,
          props.slotMinutes,
          props.hourHeight,
          props.dayWidth,
        ],
        cancel,
        { deep: true, flush: 'sync' },
      )
      function propose(
        event: SchedulerEvent,
        minutes: number,
        days: number,
        operation: 'move' | 'resize',
      ): SchedulerChange {
        const target = operation === 'move' ? event.start : event.end,
          civil = clock.parts(target, props.timeZone)
        const nominal =
          new Date(`${civil.date}T00:00:00.000Z`).getTime() +
          (civil.minute + minutes) * 60000 +
          days * 86400000
        const next = schedulerCivilFromUTC(nominal)
        const instant =
          schedulerInstant(next, props.timeZone, clock, props.disambiguation) +
          (target - Math.floor(target / 60000) * 60000)
        const result = {
          id: event.id,
          start: operation === 'move' ? instant : event.start,
          end: operation === 'move' ? instant + event.end - event.start : instant,
          kind: operation,
        }
        changeSchedulerEvent(props.modelValue, result)
        return result
      }
      function commit(change: SchedulerChange) {
        if (props.disabled || props.modelValue.find((event) => event.id === change.id)?.disabled)
          return
        emit('update:modelValue', changeSchedulerEvent(props.modelValue, change))
        emit('change', change)
      }
      function change(
        event: SchedulerEvent,
        minutes: number,
        days: number,
        operation: 'move' | 'resize',
      ) {
        if (props.disabled || event.disabled) return
        failure.value = ''
        try {
          commit(propose(event, minutes, days, operation))
        } catch (e) {
          failure.value = e instanceof Error ? e.message : String(e)
          emit('error', failure.value)
        }
      }
      function gesture(
        event: SchedulerEvent,
        operation: 'move' | 'resize',
        input: AdvancedGesture,
      ) {
        if (props.disabled || event.disabled) return
        if (input.phase === 'start') {
          original = { ...event }
          kind = operation
          dragging.value = true
          failure.value = ''
        }
        if (input.phase === 'move' && original) {
          const minutes =
              Math.round(((input.y / props.hourHeight) * 60) / props.slotMinutes) *
              props.slotMinutes,
            days = kind === 'move' ? Math.round(input.x / props.dayWidth) : 0
          try {
            const proposal = propose(original, minutes, days, kind),
              start = clock.parts(proposal.start, props.timeZone),
              end = clock.parts(proposal.end, props.timeZone)
            if (
              start.date < props.date ||
              start.date > addCivilDays(props.date, props.days - 1) ||
              start.minute < props.startHour * 60 ||
              end.date !== start.date ||
              end.minute > props.endHour * 60 ||
              end.minute <= start.minute
            ) {
              draft.value = undefined
              return
            }
            draft.value = proposal
          } catch (e) {
            draft.value = undefined
            failure.value = e instanceof Error ? e.message : String(e)
          }
        }
        if (input.phase === 'end') {
          const pending = draft.value
          cancel()
          if (pending) commit(pending)
          else if (failure.value) emit('error', failure.value)
        }
        if (input.phase === 'cancel') cancel()
      }
      function focus(event: SchedulerEvent) {
        selected.value = event.id
        emit('select', event.id)
        void nextTick(() => host.value?.focus(`${uid}-earlier`))
      }
      return () => {
        if (
          !Number.isFinite(props.hourHeight) ||
          props.hourHeight < 48 ||
          props.hourHeight > 180 ||
          !Number.isFinite(props.dayWidth) ||
          props.dayWidth < 140 ||
          props.dayWidth > 500 ||
          !Number.isInteger(props.slotMinutes) ||
          props.slotMinutes < 5 ||
          props.slotMinutes > 60 ||
          60 % props.slotMinutes !== 0
        )
          throw new RangeError(
            'Scheduler needs hourHeight 48–180, dayWidth 140–500 and a 5–60 minute divisor of an hour.',
          )
        const grid = layout.value,
          gridHeight = (props.endHour - props.startHour) * props.hourHeight + 44,
          totalWidth = 64 + props.days * props.dayWidth,
          event = props.modelValue.find((item) => item.id === selected.value)
        return h(
          ui.Host,
          mergeProps(attrs, {
            id: props.id,
            label: props.label,
            ref: host,
            ...(platform === 'web' ? { class: 'm-scheduler' } : {}),
          }),
          () =>
            h(ui.Column, { gap: 'md', motionRegion: region }, () => [
              h(ui.Text, { text: props.label, variant: 'heading' }),
              h(ui.Text, {
                text: `${props.date} · ${props.timeZone}`,
                tone: 'muted',
                variant: 'caption',
              }),
              h(ui.Row, { gap: 'sm' }, () => [
                h(ui.Button, {
                  text: props.previousLabel,
                  variant: 'secondary',
                  disabled: props.disabled,
                  onClick: () => {
                    if (!props.disabled) emit('update:date', addCivilDays(props.date, -props.days))
                  },
                }),
                h(ui.Button, {
                  text: props.nextLabel,
                  variant: 'secondary',
                  disabled: props.disabled,
                  onClick: () => {
                    if (!props.disabled) emit('update:date', addCivilDays(props.date, props.days))
                  },
                }),
              ]),
              h(ui.Scroll, {}, () =>
                h(ui.Canvas, { height: gridHeight, width: totalWidth }, () => [
                  ...Array.from({ length: props.endHour - props.startHour }, (_, i) =>
                    h(
                      ui.Cell,
                      {
                        key: `hour-${i}`,
                        x: 0,
                        y: 44 + i * props.hourHeight,
                        width: totalWidth,
                        height: props.hourHeight,
                      },
                      () =>
                        h(
                          ui.Box,
                          {
                            height: '100%',
                            borderColor: theme.value.colors.border,
                            borderWidth: 0.5,
                            ...(platform === 'web'
                              ? {
                                  style: {
                                    borderTop: `1px solid ${theme.value.colors.border}`,
                                    boxSizing: 'border-box',
                                  },
                                }
                              : {}),
                            accessibilityHidden: true,
                          },
                          () =>
                            h(ui.Text, {
                              text: time((props.startHour + i) * 60),
                              variant: 'caption',
                              tone: 'muted',
                              width: 60,
                            }),
                        ),
                    ),
                  ),
                  ...grid.flatMap((column, day) => [
                    h(
                      ui.Cell,
                      {
                        key: `day-${column.date}`,
                        x: 64 + day * props.dayWidth,
                        y: 0,
                        width: props.dayWidth,
                        height: 40,
                      },
                      () =>
                        h(ui.Text, {
                          text: column.date,
                          variant: 'body',
                          weight: '600',
                          align: 'center',
                        }),
                    ),
                    ...column.segments.map((segment) => {
                      const item = segment.event,
                        editable = !props.disabled && !item.disabled,
                        full =
                          segment.startsHere &&
                          segment.endsHere &&
                          ((segment.bottom - segment.top) / 60) * props.hourHeight >= 100
                      return h(
                        ui.Cell,
                        {
                          key: `event-${column.date}-${item.id}`,
                          x:
                            64 +
                            day * props.dayWidth +
                            (segment.lane * props.dayWidth) / segment.lanes +
                            3,
                          y: 44 + ((segment.top - props.startHour * 60) / 60) * props.hourHeight,
                          width: props.dayWidth / segment.lanes - 6,
                          height: Math.max(
                            28,
                            ((segment.bottom - segment.top) / 60) * props.hourHeight - 3,
                          ),
                        },
                        () =>
                          h(
                            ui.Box,
                            {
                              height: '100%',
                              backgroundColor: theme.value.colors.surface,
                              radius: 'sm',
                              borderWidth: 1,
                              borderColor: item.color ?? theme.value.colors.primary,
                              clipToBounds: true,
                              ...(platform === 'web'
                                ? {
                                    style: {
                                      overflow: 'hidden',
                                      border: `1px solid ${item.color ?? theme.value.colors.primary}`,
                                      borderLeftWidth: '3px',
                                      boxSizing: 'border-box',
                                    },
                                  }
                                : {}),
                            },
                            () =>
                              h(ui.Column, { gap: 'none' }, () => [
                                full
                                  ? h(
                                      ui.Gesture,
                                      {
                                        label: `${props.moveLabel}: ${item.title}`,
                                        disabled: !editable,
                                        onGesture: (input: AdvancedGesture) =>
                                          gesture(item, 'move', input),
                                        onStep: (v: { x: number; y: number }) =>
                                          change(item, v.y * props.slotMinutes, v.x, 'move'),
                                      },
                                      () =>
                                        h(ui.Text, {
                                          text: '⠿',
                                          variant: 'caption',
                                          align: 'center',
                                          accessibilityHidden: true,
                                        }),
                                    )
                                  : null,
                                h(ui.Button, {
                                  text: item.title,
                                  height: full
                                    ? undefined
                                    : Math.max(
                                        4,
                                        ((segment.bottom - segment.top) / 60) * props.hourHeight -
                                          3,
                                      ),
                                  ...(platform === 'web'
                                    ? {
                                        style: {
                                          padding: '0 4px',
                                          minHeight: 0,
                                          fontSize: '12px',
                                          overflow: 'hidden',
                                        },
                                      }
                                    : {}),
                                  accessibilityLabel: describe(item),
                                  size: 'sm',
                                  variant: selected.value === item.id ? 'secondary' : 'ghost',
                                  disabled: props.disabled || item.disabled,
                                  onClick: () => focus(item),
                                }),
                                full
                                  ? h(
                                      ui.Gesture,
                                      {
                                        label: `${props.resizeLabel}: ${item.title}`,
                                        disabled: !editable,
                                        onGesture: (input: AdvancedGesture) =>
                                          gesture(item, 'resize', input),
                                        onStep: (v: { x: number; y: number }) =>
                                          change(
                                            item,
                                            (v.y || v.x) * props.slotMinutes,
                                            0,
                                            'resize',
                                          ),
                                      },
                                      () =>
                                        h(ui.Text, {
                                          text: '━',
                                          variant: 'caption',
                                          align: 'center',
                                          accessibilityHidden: true,
                                        }),
                                    )
                                  : null,
                              ]),
                          ),
                      )
                    }),
                  ]),
                ]),
              ),
              !grid.some((column) => column.segments.length)
                ? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })
                : null,
              failure.value
                ? h(ui.Text, {
                    text: failure.value,
                    ...(platform === 'web' ? { role: 'alert' } : {}),
                  })
                : null,
              h(ui.Column, { gap: 'xs' }, () =>
                props.modelValue.map((item) =>
                  h(ui.Button, {
                    key: item.id,
                    text: describe(item),
                    variant: selected.value === item.id ? 'secondary' : 'ghost',
                    disabled: props.disabled || item.disabled,
                    onClick: () => focus(item),
                  }),
                ),
              ),
              event
                ? h(ui.Card, { padding: 'md' }, () =>
                    h(ui.Column, { gap: 'sm' }, () => [
                      h(ui.Text, { text: describe(event), variant: 'body', weight: '600' }),
                      h(
                        ui.Stack,
                        {
                          direction: 'column',
                          responsive: { at: 600, direction: 'row' },
                          gap: 'xs',
                        },
                        () => [
                          h(ui.Button, {
                            id: `${uid}-earlier`,
                            text: props.earlierLabel,
                            variant: 'secondary',
                            disabled: props.disabled || event.disabled,
                            onClick: () => change(event, -props.slotMinutes, 0, 'move'),
                          }),
                          h(ui.Button, {
                            text: props.laterLabel,
                            variant: 'secondary',
                            disabled: props.disabled || event.disabled,
                            onClick: () => change(event, props.slotMinutes, 0, 'move'),
                          }),
                          h(ui.Button, {
                            text: props.previousDayLabel,
                            variant: 'ghost',
                            disabled: props.disabled || event.disabled,
                            onClick: () => change(event, 0, -1, 'move'),
                          }),
                          h(ui.Button, {
                            text: props.nextDayLabel,
                            variant: 'ghost',
                            disabled: props.disabled || event.disabled,
                            onClick: () => change(event, 0, 1, 'move'),
                          }),
                          h(ui.Button, {
                            text: props.shorterLabel,
                            variant: 'ghost',
                            disabled:
                              props.disabled ||
                              event.disabled ||
                              event.end - event.start <= props.slotMinutes * 60000,
                            onClick: () => change(event, -props.slotMinutes, 0, 'resize'),
                          }),
                          h(ui.Button, {
                            text: props.longerLabel,
                            variant: 'ghost',
                            disabled: props.disabled || event.disabled,
                            onClick: () => change(event, props.slotMinutes, 0, 'resize'),
                          }),
                        ],
                      ),
                    ]),
                  )
                : null,
            ]),
        )
      }
    },
  })
}
