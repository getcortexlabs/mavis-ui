import {
  civilDate,
  dateTimeMilliseconds,
  resolveDateTimeOptions,
  type DateTimeValue,
  type DateTimeFormatOptions,
} from '@getcortexlabs/mavis-core'
export type { DateTimeValue, DateTimeFormatOptions, DateTimeStyle } from '@getcortexlabs/mavis-core'

interface Formatter {
  setTimeZone(zone: unknown): void
  setCalendar(calendar: unknown): void
  format(date: unknown): string
}
declare const java: {
  util: {
    Date: new (milliseconds: number) => unknown
    GregorianCalendar: new (
      zone: unknown,
      locale: unknown,
    ) => { setGregorianChange(date: unknown): void }
    Locale: { forLanguageTag(locale: string): unknown; US: unknown }
    TimeZone: { getAvailableIDs(): ArrayLike<string>; getTimeZone(id: string): unknown }
  }
  text: {
    DateFormat: {
      getDateTimeInstance(date: number, time: number, locale: unknown): Formatter
      getDateInstance(date: number, locale: unknown): Formatter
      getTimeInstance(time: number, locale: unknown): Formatter
    }
    SimpleDateFormat: new (pattern: string, locale: unknown) => Formatter
  }
}
function zone(name: string) {
  // TimeZone.getTimeZone silently returns GMT for unknown identifiers. Reject that fallback.
  const known = Array.from(java.util.TimeZone.getAvailableIDs())
  if (!known.includes(name)) throw new RangeError(`Unknown timeZone: ${name}`)
  return java.util.TimeZone.getTimeZone(name)
}
function configureCalendar(formatter: Formatter, timeZone: string, locale: unknown) {
  const value = zone(timeZone)
  const calendar = new java.util.GregorianCalendar(value, locale)
  calendar.setGregorianChange(new java.util.Date(-8640000000000000))
  formatter.setCalendar(calendar)
}
export function formatDateTime(value: DateTimeValue, options: DateTimeFormatOptions): string {
  const milliseconds = dateTimeMilliseconds(value)
  const config = resolveDateTimeOptions(options)
  const locale = java.util.Locale.forLanguageTag(config.locale)
  const styles = { full: 0, long: 1, medium: 2, short: 3 }
  const factory = java.text.DateFormat
  const result =
    config.dateStyle && config.timeStyle
      ? factory.getDateTimeInstance(styles[config.dateStyle], styles[config.timeStyle], locale)
      : config.dateStyle
        ? factory.getDateInstance(styles[config.dateStyle], locale)
        : factory.getTimeInstance(styles[config.timeStyle!], locale)
  configureCalendar(result, config.timeZone, locale)
  return String(result.format(new java.util.Date(milliseconds)))
}
export function dateTimeToCivilDate(
  value: DateTimeValue,
  options: Pick<DateTimeFormatOptions, 'timeZone'>,
) {
  const milliseconds = dateTimeMilliseconds(value)
  const { timeZone } = resolveDateTimeOptions(options)
  const result = new java.text.SimpleDateFormat('G yyyy-MM-dd', java.util.Locale.US)
  configureCalendar(result, timeZone, java.util.Locale.US)
  const text = String(result.format(new java.util.Date(milliseconds)))
  if (!text.startsWith('AD ')) throw new RangeError('Civil dates support years 0001–9999.')
  return civilDate(text.slice(3))
}

const schedulerFormats = new Map<string, Formatter>()
export function schedulerParts(
  value: DateTimeValue,
  options: Pick<DateTimeFormatOptions, 'timeZone'>,
) {
  const milliseconds = dateTimeMilliseconds(value)
  const { timeZone } = resolveDateTimeOptions(options)
  let result = schedulerFormats.get(timeZone)
  if (!result) {
    result = new java.text.SimpleDateFormat('G yyyy-MM-dd HH:mm', java.util.Locale.US)
    configureCalendar(result, timeZone, java.util.Locale.US)
    if (schedulerFormats.size >= 32) schedulerFormats.clear()
    schedulerFormats.set(timeZone, result)
  }
  const text = String(result.format(new java.util.Date(milliseconds)))
  if (!text.startsWith('AD ')) throw new RangeError('Civil dates support years 0001–9999.')
  return {
    date: civilDate(text.slice(3, 13)),
    minute: Number(text.slice(14, 16)) * 60 + Number(text.slice(17, 19)),
  }
}
