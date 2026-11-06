import { useComponentPaint } from '../component-motion.js'
import { useMotionSurface } from '../use-motion-surface.js'
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { calendarDayLabel, fontFamily, type CivilDate } from '@getcortexlabs/mavis-core'
import {
  dateCalendarProps,
  dateCalendarEmits,
  useDateCalendar,
  useMavisTheme,
  useCalendarMotion,
} from '@getcortexlabs/mavis-core/vue'
import { MButton } from './MButton.js'
import { MRow, MColumn } from './layout.js'

const CalendarDay = defineComponent({
  inheritAttrs: false,
  props: { painted: Boolean },
  setup(props, { attrs, slots }) {
    const background = ref<HTMLElement>()
    const { theme } = useMavisTheme()
    useComponentPaint(background, () => ({
      opacity: props.painted ? 1 : 0,
      scale: props.painted ? 1 : 0.8,
    }))
    return () =>
      h(
        'button',
        {
          ...attrs,
          style: [attrs.style, { position: 'relative', backgroundColor: 'transparent' }],
        },
        [
          h('span', {
            ref: background,
            'aria-hidden': 'true',
            style: {
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              backgroundColor: theme.value.colors.primarySoft,
              pointerEvents: 'none',
              opacity: props.painted ? 1 : 0,
            },
          }),
          h('span', { style: { position: 'relative' } }, slots.default?.()),
        ],
      )
  },
})

/** @internal Month grid with one Tab stop; unavailable days remain readable and cannot commit. */
export const DateCalendar = defineComponent({
  name: 'DateCalendar',
  props: dateCalendarProps,
  emits: dateCalendarEmits,
  setup(props, { emit }) {
    const { theme } = useMavisTheme()
    const calendar = useDateCalendar(props, (value) => emit('update:activeDate', value))
    const root = ref<HTMLElement>()
    const days = new Map<CivilDate, HTMLButtonElement>()
    let alive = true
    function focusDay() {
      void nextTick(() => {
        if (alive) days.get(props.activeDate)?.focus({ preventScroll: true })
      })
    }
    onMounted(() => {
      if (props.autofocus) focusDay()
    })
    onBeforeUnmount(() => {
      alive = false
      days.clear()
    })
    watch(
      () => props.activeDate,
      () => {
        // Header navigation keeps focus on its button. Grid movement keeps focus in the grid.
        if (root.value?.querySelector('table')?.contains(document.activeElement)) focusDay()
      },
    )
    const presentation = useCalendarMotion(() => props.activeDate)
    const motion = useMotionSurface(() => presentation)
    return () => {
      const { colors, typography, radius } = theme.value
      const cells = calendar.cells.value
      const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
        cells.slice(index * 7, index * 7 + 7),
      )
      return h(
        MColumn,
        { gap: 'sm' },
        {
          default: () => [
            h(
              MRow,
              { justify: 'between', gap: 'sm', wrap: true },
              {
                default: () => [
                  h(MButton, {
                    icon: 'chevron-left',
                    variant: 'ghost',
                    accessibilityLabel: calendar.words.value.previous,
                    disabled: props.disabled || !calendar.canPage(-1),
                    onClick: () => calendar.page(-1),
                  }),
                  h(
                    'h3',
                    {
                      'aria-live': 'polite',
                      style: {
                        margin: 0,
                        color: colors.text,
                        fontSize: `${typography.body.fontSize}px`,
                        lineHeight: 1.5,
                      },
                    },
                    calendar.title.value,
                  ),
                  h(MButton, {
                    icon: 'chevron-right',
                    variant: 'ghost',
                    accessibilityLabel: calendar.words.value.next,
                    disabled: props.disabled || !calendar.canPage(1),
                    onClick: () => calendar.page(1),
                  }),
                ],
              },
            ),
            h(
              'div',
              {
                ref: root,
                class: 'm-date-calendar',
                style: { overflowX: 'auto', maxWidth: '100%' },
              },
              [
                h(
                  'table',
                  {
                    ...motion,
                    role: 'grid',
                    'aria-label': calendar.title.value,
                    style: {
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                      tableLayout: 'fixed',
                      width: '100%',
                      minWidth: 'max(308px, 17.5em)',
                      fontFamily: fontFamily(typography.body.fontFamily, 'web'),
                      fontSize: `${typography.body.fontSize}px`,
                    },
                    onKeydown: (event: KeyboardEvent) => {
                      if (
                        props.disabled ||
                        event.altKey ||
                        event.ctrlKey ||
                        event.metaKey ||
                        event.isComposing
                      )
                        return
                      if (
                        calendar.key(
                          event.key,
                          event.shiftKey,
                          getComputedStyle(root.value!).direction === 'rtl',
                        )
                      ) {
                        event.preventDefault()
                        focusDay()
                      }
                    },
                  },
                  [
                    h('thead', [
                      h(
                        'tr',
                        calendar.weekdays.value.map((weekday) =>
                          h(
                            'th',
                            {
                              scope: 'col',
                              abbr: calendar.words.value.weekdays[weekday],
                              style: { padding: '8px 0', color: colors.muted, fontWeight: 500 },
                            },
                            calendar.words.value.shortWeekdays[weekday],
                          ),
                        ),
                      ),
                    ]),
                    h(
                      'tbody',
                      weeks.map((week, index) =>
                        h(
                          'tr',
                          { key: index },
                          week.map((date, column) => {
                            if (!date) return h('td', { key: column })
                            const selected =
                              date === props.selected ||
                              date === props.rangeStart ||
                              date === props.rangeEnd
                            const available =
                              !props.disabled && !props.readonly && calendar.available(date)
                            const active = date === props.activeDate
                            return h(
                              'td',
                              { key: date, 'aria-selected': selected, style: { padding: '2px' } },
                              [
                                h(
                                  CalendarDay,
                                  {
                                    painted: selected || calendar.inRange(date),
                                    ref: (element: unknown) => {
                                      if (element)
                                        days.set(
                                          date,
                                          ((element as { $el?: HTMLButtonElement }).$el ??
                                            element) as HTMLButtonElement,
                                        )
                                      else days.delete(date)
                                    },
                                    type: 'button',
                                    tabindex: active ? 0 : -1,
                                    class: 'm-date-day',
                                    'aria-label': calendarDayLabel(date, props.locale),
                                    'aria-disabled': !available || undefined,
                                    'data-date': date,
                                    'data-selected': selected,
                                    style: {
                                      display: 'block',
                                      boxSizing: 'border-box',
                                      width: '100%',
                                      minHeight: '44px',
                                      padding: '8px 2px',
                                      border: `2px solid ${selected ? colors.primary : 'transparent'}`,
                                      borderRadius: `${radius.sm}px`,
                                      backgroundColor:
                                        selected || calendar.inRange(date)
                                          ? colors.primarySoft
                                          : 'transparent',
                                      color: available ? colors.text : colors.muted,
                                      opacity: available ? 1 : 0.55,
                                      font: 'inherit',
                                      fontWeight: selected ? 700 : 400,
                                      cursor: available ? 'pointer' : 'default',
                                      outlineColor: colors.primary,
                                      outlineOffset: '-2px',
                                    },
                                    onFocus: () => {
                                      if (props.activeDate !== date) emit('update:activeDate', date)
                                    },
                                    onClick: () => {
                                      if (available) emit('select', date)
                                    },
                                  },
                                  () => String(Number(date.slice(8))),
                                ),
                              ],
                            )
                          }),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        },
      )
    }
  },
})
