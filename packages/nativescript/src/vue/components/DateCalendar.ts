import { useMotionSurface } from '../use-motion-surface.js'
import { defineComponent, h } from 'nativescript-vue'
import { calendarDayLabel } from '@getcortexlabs/mavis-core'
import {
  dateCalendarProps,
  dateCalendarEmits,
  useDateCalendar,
  useMavisTheme,
  useCalendarMotion,
  useComponentState,
} from '@getcortexlabs/mavis-core/vue'
import { MButton } from './MButton.js'
import { MText } from './MText.js'
import { MColumn, MRow, MBox } from './layout.js'

const CalendarDay = defineComponent({
  inheritAttrs: false,
  props: { painted: Boolean },
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const fill = useComponentState(() => ({
      opacity: props.painted ? 1 : 0,
      scale: props.painted ? 1 : 0.8,
    }))
    return () =>
      h(MBox, { row: attrs.row, col: attrs.col }, () => [
        h(MBox, {
          width: '100%',
          height: '100%',
          radius: 'sm',
          backgroundColor: theme.value.colors.primarySoft,
          motionSurface: fill,
          accessibilityHidden: true,
          isUserInteractionEnabled: false,
        }),
        h(MButton, {
          ...attrs,
          row: undefined,
          col: undefined,
          style: [attrs.style, { backgroundColor: 'transparent' }],
        }),
      ])
  },
})

/** @internal Natural-size native buttons; horizontal scrolling preserves large text and targets. */
export const DateCalendar = defineComponent({
  name: 'DateCalendar',
  props: dateCalendarProps,
  emits: dateCalendarEmits,
  setup(props, { emit }) {
    const { theme } = useMavisTheme()
    const calendar = useDateCalendar(props, (value) => emit('update:activeDate', value))
    const presentation = useCalendarMotion(() => props.activeDate)
    const motion = useMotionSurface(() => presentation)
    return () => {
      const { colors, radius } = theme.value
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
                  h(MText, {
                    text: calendar.title.value,
                    weight: '600',
                    shrink: 1,
                    accessibilityLiveRegion: 'polite',
                  }),
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
            h('ScrollView', { orientation: 'horizontal' }, [
              h(
                'GridLayout',
                {
                  ...motion,
                  columns: 'auto,auto,auto,auto,auto,auto,auto',
                  rows: Array.from(
                    { length: calendar.cells.value.length / 7 + 1 },
                    () => 'auto',
                  ).join(','),
                },
                [
                  ...calendar.weekdays.value.map((weekday, column) =>
                    h(MText, {
                      key: `weekday-${weekday}`,
                      row: 0,
                      col: column,
                      text: calendar.words.value.shortWeekdays[weekday],
                      variant: 'caption',
                      tone: 'muted',
                      accessibilityLabel: calendar.words.value.weekdays[weekday],
                      style: { minWidth: 44, textAlignment: 'center', padding: 8 },
                    }),
                  ),
                  ...calendar.cells.value.map((date, index) => {
                    if (!date) return null
                    const selected =
                      date === props.selected ||
                      date === props.rangeStart ||
                      date === props.rangeEnd
                    return h(CalendarDay, {
                      painted: selected || calendar.inRange(date),
                      key: date,
                      row: Math.floor(index / 7) + 1,
                      col: index % 7,
                      text: String(Number(date.slice(8))),
                      variant: 'ghost',
                      accessibilityLabel: calendarDayLabel(date, props.locale),
                      accessibilityValue: selected ? calendar.words.value.selected : '',
                      disabled: props.disabled || props.readonly || !calendar.available(date),
                      style: {
                        minWidth: 44,
                        minHeight: 48,
                        margin: 1,
                        paddingLeft: 6,
                        paddingRight: 6,
                        borderWidth: 2,
                        borderColor: selected ? colors.primary : 'transparent',
                        borderRadius: radius.sm,
                        backgroundColor:
                          selected || calendar.inRange(date) ? colors.primarySoft : 'transparent',
                        color: colors.text,
                      },
                      onClick: () => {
                        if (!props.disabled && !props.readonly && calendar.available(date))
                          emit('select', date)
                      },
                    })
                  }),
                ],
              ),
            ]),
          ],
        },
      )
    }
  },
})
