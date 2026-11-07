import {
  civilDate,
  dateTimeMilliseconds,
  resolveDateTimeOptions,
  type DateTimeValue,
  type DateTimeFormatOptions,
} from '@getcortexlabs/mavis-core'
export type { DateTimeValue, DateTimeFormatOptions, DateTimeStyle } from '@getcortexlabs/mavis-core'

declare const NSDate: { dateWithTimeIntervalSince1970(seconds: number): unknown }
declare const NSTimeZone: { timeZoneWithName(name: string): unknown | null }
declare const NSLocale: { alloc(): { initWithLocaleIdentifier(locale: string): unknown } }
declare const NSCalendar: { calendarWithIdentifier(identifier: string): unknown }
interface Formatter {
  locale: unknown
  timeZone: unknown
  calendar: unknown
  dateStyle: number
  timeStyle: number
  dateFormat: string
  gregorianStartDate: unknown
  stringFromDate(value: unknown): string
}
declare const NSDateFormatter: { new: () => Formatter }
function formatter(options: DateTimeFormatOptions) {
  const config = resolveDateTimeOptions(options)
  const zone = NSTimeZone.timeZoneWithName(config.timeZone)
  if (!zone) throw new RangeError(`Unknown timeZone: ${config.timeZone}`)
  const result = NSDateFormatter.new()
  result.locale = NSLocale.alloc().initWithLocaleIdentifier(config.locale)
  result.calendar = NSCalendar.calendarWithIdentifier('gregorian')
  result.gregorianStartDate = NSDate.dateWithTimeIntervalSince1970(-8640000000000)
  result.timeZone = zone
  const styles = { short: 1, medium: 2, long: 3, full: 4 }
  result.dateStyle = config.dateStyle ? styles[config.dateStyle] : 0
  result.timeStyle = config.timeStyle ? styles[config.timeStyle] : 0
  return result
}
export function formatDateTime(value: DateTimeValue, options: DateTimeFormatOptions): string {
  const instant = NSDate.dateWithTimeIntervalSince1970(dateTimeMilliseconds(value) / 1000)
  return formatter(options).stringFromDate(instant)
}
export function dateTimeToCivilDate(
  value: DateTimeValue,
  options: Pick<DateTimeFormatOptions, 'timeZone'>,
) {
  const result = formatter({ ...options, locale: 'en-US-POSIX', dateStyle: 'short' })
  result.dateFormat = 'G yyyy-MM-dd'
  const text = result.stringFromDate(
    NSDate.dateWithTimeIntervalSince1970(dateTimeMilliseconds(value) / 1000),
  )
  if (!text.startsWith('AD ')) throw new RangeError('Civil dates support years 0001–9999.')
  return civilDate(text.slice(3))
}

const schedulerFormats = new Map<string, Formatter>()
export function schedulerParts(
  value: DateTimeValue,
  options: Pick<DateTimeFormatOptions, 'timeZone'>,
) {
  let result = schedulerFormats.get(options.timeZone)
  if (!result) {
    result = formatter({ ...options, locale: 'en-US-POSIX', dateStyle: 'short' })
    result.dateFormat = 'G yyyy-MM-dd HH:mm'
    if (schedulerFormats.size >= 32) schedulerFormats.clear()
    schedulerFormats.set(options.timeZone, result)
  }
  const text = result.stringFromDate(
    NSDate.dateWithTimeIntervalSince1970(dateTimeMilliseconds(value) / 1000),
  )
  if (!text.startsWith('AD ')) throw new RangeError('Civil dates support years 0001–9999.')
  return {
    date: civilDate(text.slice(3, 13)),
    minute: Number(text.slice(14, 16)) * 60 + Number(text.slice(17, 19)),
  }
}
