import {
  civilDate,
  dateTimeMilliseconds,
  resolveDateTimeOptions,
  type DateTimeValue,
  type DateTimeFormatOptions,
} from '@getcortexlabs/mavis-core'
export type { DateTimeValue, DateTimeFormatOptions, DateTimeStyle } from '@getcortexlabs/mavis-core'

export function formatDateTime(value: DateTimeValue, options: DateTimeFormatOptions): string {
  const { locale, ...format } = resolveDateTimeOptions(options)
  return new Intl.DateTimeFormat(locale, { ...format, calendar: 'gregory' }).format(
    dateTimeMilliseconds(value),
  )
}

/** Explicit conversion from an instant to a Gregorian calendar day in a named zone. */
export function dateTimeToCivilDate(
  value: DateTimeValue,
  options: Pick<DateTimeFormatOptions, 'timeZone'>,
) {
  const { timeZone } = resolveDateTimeOptions(options)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    era: 'short',
  }).formatToParts(dateTimeMilliseconds(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value
  if (part('era') !== 'AD') throw new RangeError('Civil dates support years 0001–9999.')
  return civilDate(`${part('year')!.padStart(4, '0')}-${part('month')}-${part('day')}`)
}
