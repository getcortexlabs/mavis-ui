import { addCivilDays, civilDate, parseCivilDate, formatCivilDate, type CivilDate } from './date.js'
import { uniqueAdvanced } from './advanced-collections.js'
export interface SchedulerEvent {
  id: string
  title: string
  start: number
  end: number
  color?: string
  disabled?: boolean
}
export interface SchedulerCivilTime {
  date: CivilDate
  minute: number
}
export interface SchedulerClock {
  parts(instant: number, timeZone: string): SchedulerCivilTime
}
export type SchedulerDisambiguation = 'reject' | 'earlier' | 'later'
export interface SchedulerChange {
  id: string
  start: number
  end: number
  kind: 'move' | 'resize'
}
function civilMilliseconds(value: SchedulerCivilTime) {
  const parts = parseCivilDate(value.date)
  if (!parts || !Number.isInteger(value.minute) || value.minute < 0 || value.minute >= 1440)
    throw new RangeError('Invalid scheduler civil time.')
  const date = new Date(0)
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day)
  date.setUTCHours(0, value.minute, 0, 0)
  return date.getTime()
}
export function schedulerCivilFromUTC(value: number): SchedulerCivilTime {
  const date = new Date(value)
  return {
    date: formatCivilDate({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    }),
    minute: date.getUTCHours() * 60 + date.getUTCMinutes(),
  }
}
/** Resolve wall time by testing actual zone offsets around the date; never guess a DST gap. */
export function schedulerInstant(
  value: SchedulerCivilTime,
  timeZone: string,
  clock: SchedulerClock,
  disambiguation: SchedulerDisambiguation = 'reject',
) {
  if (!['reject', 'earlier', 'later'].includes(disambiguation))
    throw new RangeError('Invalid scheduler disambiguation.')
  if (!timeZone.trim()) throw new RangeError('Scheduler requires an explicit timeZone.')
  const nominal = civilMilliseconds(value),
    offsets = new Set<number>()
  for (let hours = -36; hours <= 36; hours += 6) {
    const instant = nominal + hours * 3600000
    offsets.add(civilMilliseconds(clock.parts(instant, timeZone)) - instant)
  }
  const matches = [...offsets]
    .map((offset) => nominal - offset)
    .filter((instant) => {
      const parts = clock.parts(instant, timeZone)
      return parts.date === value.date && parts.minute === value.minute
    })
    .sort((a, b) => a - b)
  if (!matches.length)
    throw new RangeError('This local time does not exist in the selected time zone.')
  if (matches.length > 1 && disambiguation === 'reject')
    throw new RangeError('This local time occurs twice. Choose earlier or later explicitly.')
  return matches[disambiguation === 'later' ? matches.length - 1 : 0]!
}
export function validateSchedulerEvents(events: readonly SchedulerEvent[]) {
  uniqueAdvanced(events, 'Scheduler', 500)
  for (const event of events)
    if (
      !event.title.trim() ||
      !Number.isFinite(event.start) ||
      !Number.isFinite(event.end) ||
      event.end <= event.start ||
      event.end - event.start > 31 * 86400000 ||
      Math.abs(event.start) > 8640000000000000 ||
      Math.abs(event.end) > 8640000000000000 ||
      (event.color && !/^#[\da-f]{6}$/i.test(event.color))
    )
      throw new RangeError(
        'Scheduler events require a title, ordered epoch milliseconds (duration <=31 days) and optional HEX color.',
      )
}
export function changeSchedulerEvent<T extends SchedulerEvent>(
  events: readonly T[],
  change: SchedulerChange,
) {
  validateSchedulerEvents(events)
  const event = events.find((event) => event.id === change.id)
  if (!event || event.disabled) return [...events]
  const next = events.map((event) =>
    event.id === change.id ? { ...event, start: change.start, end: change.end } : event,
  )
  validateSchedulerEvents(next)
  return next
}
export function schedulerLayout(
  events: readonly SchedulerEvent[],
  date: CivilDate,
  days: number,
  timeZone: string,
  clock: SchedulerClock,
  startHour = 0,
  endHour = 24,
) {
  civilDate(date)
  clock.parts(new Date(`${date}T12:00:00.000Z`).getTime(), timeZone)
  validateSchedulerEvents(events)
  if (
    ![1, 7].includes(days) ||
    !Number.isInteger(startHour) ||
    !Number.isInteger(endHour) ||
    startHour < 0 ||
    endHour > 24 ||
    startHour >= endHour
  )
    throw new RangeError('Scheduler needs a day/week and ordered whole-hour bounds.')
  return Array.from({ length: days }, (_, day) => {
    const civil = addCivilDays(date, day)
    const segments = events
      .flatMap((event) => {
        const start = clock.parts(event.start, timeZone),
          end = clock.parts(event.end, timeZone)
        if (start.date > civil || end.date < civil || (end.date === civil && end.minute === 0))
          return []
        const top = Math.max(startHour * 60, start.date < civil ? 0 : start.minute),
          bottom = Math.min(endHour * 60, end.date > civil ? 1440 : end.minute)
        // A repeated-hour event may finish at an earlier wall time; retain its elapsed duration.
        const finish =
          end.minute <= start.minute &&
          start.minute >= startHour * 60 &&
          start.minute < endHour * 60 &&
          event.end > event.start &&
          start.date === civil &&
          end.date === civil
            ? Math.min(endHour * 60, top + (event.end - event.start) / 60000)
            : bottom
        return finish > top
          ? [
              {
                event,
                day,
                date: civil,
                top,
                bottom: finish,
                lane: 0,
                lanes: 1,
                startsHere: start.date === civil,
                endsHere: end.date === civil,
              },
            ]
          : []
      })
      .sort(
        (a, b) =>
          a.top - b.top || a.event.start - b.event.start || a.event.id.localeCompare(b.event.id),
      )
    let group: typeof segments = [],
      ends: number[] = [],
      groupEnd = 0
    function finish() {
      for (const segment of group) segment.lanes = ends.length
      group = []
      ends = []
    }
    for (const segment of segments) {
      if (group.length && segment.top >= groupEnd) finish()
      let lane = ends.findIndex((end) => end <= segment.top)
      if (lane < 0) lane = ends.length
      ends[lane] = segment.bottom
      segment.lane = lane
      group.push(segment)
      groupEnd = Math.max(...ends)
    }
    finish()
    return { date: civil, segments }
  })
}

/** Offset distinguishes the two occurrences of a repeated local time. */
export function schedulerOffset(instant: number, timeZone: string, clock: SchedulerClock) {
  const minutes = Math.round(
    (civilMilliseconds(clock.parts(instant, timeZone)) - Math.floor(instant / 60000) * 60000) /
      60000,
  )
  return `UTC${minutes >= 0 ? '+' : '−'}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`
}
