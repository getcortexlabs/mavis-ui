import { computed, watch, type ExtractPropTypes } from '@vue/runtime-core'
import {
  addCivilDays,
  addCivilMonths,
  calendarMonth,
  civilWeekday,
  dateAvailability,
  dateLocales,
  parseCivilDate,
  type CivilDate,
} from '../date.js'
import { dateCalendarProps } from './date-props.js'

/** @internal Calendar arithmetic and live bounds shared by Web and native presentations. */
export function useDateCalendar(
  props: ExtractPropTypes<typeof dateCalendarProps>,
  change: (value: CivilDate) => void,
) {
  const words = computed(() => dateLocales[props.locale])
  const firstDay = computed(() => props.firstDayOfWeek ?? words.value.firstDayOfWeek)
  const cells = computed(() => calendarMonth(props.activeDate, firstDay.value))
  const title = computed(() => {
    const parts = parseCivilDate(props.activeDate)!
    return `${words.value.months[parts.month - 1]} ${String(parts.year).padStart(4, '0')}`
  })
  const weekdays = computed(() =>
    Array.from({ length: 7 }, (_, index) => (index + firstDay.value) % 7),
  )
  const available = (date: CivilDate) => dateAvailability(date, props) === null
  function clamp(value: CivilDate) {
    if (props.min && value < props.min) return props.min
    if (props.max && value > props.max) return props.max
    return value
  }
  function move(value: CivilDate) {
    change(clamp(value))
  }
  function canPage(amount: number) {
    const next = addCivilMonths(props.activeDate, amount)
    return (
      next.slice(0, 7) !== props.activeDate.slice(0, 7) &&
      (!props.min || next.slice(0, 7) >= props.min.slice(0, 7)) &&
      (!props.max || next.slice(0, 7) <= props.max.slice(0, 7))
    )
  }
  function page(amount: number) {
    if (canPage(amount)) move(addCivilMonths(props.activeDate, amount))
  }
  function key(key: string, shift = false, rtl = false): boolean {
    const active = props.activeDate
    if (key === 'ArrowLeft') move(addCivilDays(active, rtl ? 1 : -1))
    else if (key === 'ArrowRight') move(addCivilDays(active, rtl ? -1 : 1))
    else if (key === 'ArrowUp') move(addCivilDays(active, -7))
    else if (key === 'ArrowDown') move(addCivilDays(active, 7))
    else if (key === 'Home')
      move(addCivilDays(active, -((civilWeekday(active) - firstDay.value + 7) % 7)))
    else if (key === 'End')
      move(addCivilDays(active, 6 - ((civilWeekday(active) - firstDay.value + 7) % 7)))
    else if (key === 'PageUp') move(addCivilMonths(active, shift ? -12 : -1))
    else if (key === 'PageDown') move(addCivilMonths(active, shift ? 12 : 1))
    else return false
    return true
  }
  watch(
    () => [props.min, props.max, props.activeDate],
    () => {
      const value = clamp(props.activeDate)
      if (value !== props.activeDate) change(value)
    },
  )
  const inRange = (date: CivilDate) =>
    Boolean(
      props.rangeStart && props.rangeEnd && date >= props.rangeStart && date <= props.rangeEnd,
    )
  return { words, title, firstDay, cells, weekdays, available, move, canPage, page, key, inRange }
}
