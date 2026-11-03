/** A wall-clock time, independent of date, timezone and daylight-saving transitions. */
export type LocalTime = string
export type TimeLocale = 'en-US' | 'pt-BR'
export type HourCycle = 'h12' | 'h23'
export interface TimeOptions {
  locale?: TimeLocale
  hourCycle?: HourCycle
  min?: LocalTime
  max?: LocalTime
  minuteStep?: number
}
export type TimeValidation =
  | { status: 'empty'; value: null }
  | { status: 'valid'; value: LocalTime }
  | { status: 'incomplete' | 'invalid' | 'range' | 'step'; value: null }

export function timeMinutes(value: LocalTime): number {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new RangeError('Time must use HH:mm between 00:00 and 23:59.')
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
}
export function localTime(minutes: number): LocalTime {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 1440)
    throw new RangeError('Time requires an integer minute within one day.')
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
export function timeOptions(options: TimeOptions = {}) {
  const min = options.min === undefined ? 0 : timeMinutes(options.min)
  const max = options.max === undefined ? 1439 : timeMinutes(options.max)
  const step = options.minuteStep ?? 1
  if (min > max)
    throw new RangeError('Time min must not exceed max; overnight ranges are not supported.')
  if (!Number.isInteger(step) || step < 1 || step > 30 || 60 % step)
    throw new RangeError('minuteStep must be a divisor of 60 between 1 and 30.')
  if (Math.ceil(min / step) * step > max)
    throw new RangeError('Time bounds contain no selectable time.')
  const locale = options.locale ?? 'en-US'
  const cycle = options.hourCycle ?? (locale === 'pt-BR' ? 'h23' : 'h12')
  if (!['en-US', 'pt-BR'].includes(locale) || !['h12', 'h23'].includes(cycle))
    throw new RangeError('Unsupported time locale or hour cycle.')
  return { min, max, step, cycle }
}
export function validateTime(value: LocalTime | null, options: TimeOptions = {}): TimeValidation {
  const { min, max, step } = timeOptions(options)
  if (value === null) return { status: 'empty', value: null }
  let minutes: number
  try {
    minutes = timeMinutes(value)
  } catch {
    return { status: 'invalid', value: null }
  }
  if (minutes < min || minutes > max) return { status: 'range', value: null }
  if (minutes % step) return { status: 'step', value: null }
  return { status: 'valid', value }
}
/** Deterministic during SSR and on native runtimes without Intl. Never constructs a Date. */
export function formatTime(value: LocalTime | null, options: TimeOptions = {}): string {
  const { cycle } = timeOptions(options)
  if (value === null) return ''
  const minutes = timeMinutes(value)
  if (cycle === 'h23') return value
  const hour = Math.floor(minutes / 60)
  return `${hour % 12 || 12}:${value.slice(3)} ${hour < 12 ? 'AM' : 'PM'}`
}
export function parseTime(draft: string, options: TimeOptions = {}): TimeValidation {
  const { cycle } = timeOptions(options)
  const text = draft.trim()
  if (!text) return { status: 'empty', value: null }
  const match =
    cycle === 'h23' ? /^(\d{1,2}):(\d{2})$/.exec(text) : /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text)
  if (!match)
    return {
      status: /^\d{0,2}(?::\d{0,2})?\s*[apm]{0,2}$/i.test(text) ? 'incomplete' : 'invalid',
      value: null,
    }
  let hour = Number(match[1])
  if (Number(match[2]) > 59) return { status: 'invalid', value: null }
  if (cycle === 'h12') {
    if (hour < 1 || hour > 12) return { status: 'invalid', value: null }
    hour = (hour % 12) + (match[3]!.toUpperCase() === 'PM' ? 12 : 0)
  } else if (hour > 23) return { status: 'invalid', value: null }
  return validateTime(localTime(hour * 60 + Number(match[2])), options)
}
