/** An instant is a Date or milliseconds since the Unix epoch; strings are never guessed. */
export type DateTimeValue = Date | number
export type DateTimeStyle = 'short' | 'medium' | 'long' | 'full'
export interface DateTimeFormatOptions {
  /** Explicit IANA zone (or UTC), required for deterministic server/client presentation. */
  timeZone: string
  locale?: string
  dateStyle?: DateTimeStyle
  timeStyle?: DateTimeStyle
}
export function dateTimeMilliseconds(value: DateTimeValue): number {
  const milliseconds = value instanceof Date ? value.getTime() : value
  if (
    typeof milliseconds !== 'number' ||
    !Number.isFinite(milliseconds) ||
    Math.abs(milliseconds) > 8640000000000000
  )
    throw new RangeError('An instant must be a valid Date or finite epoch milliseconds.')
  return Math.trunc(milliseconds)
}
/** @internal Shared option validation, without acquiring a platform formatter. */
export function resolveDateTimeOptions(options: DateTimeFormatOptions) {
  if (!options || typeof options.timeZone !== 'string' || !options.timeZone.trim())
    throw new RangeError('An explicit timeZone is required.')
  const locale = options.locale ?? 'en-US'
  if (!/^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/i.test(locale)) throw new RangeError('Use a BCP 47 locale.')
  for (const style of [options.dateStyle, options.timeStyle])
    if (style !== undefined && !['short', 'medium', 'long', 'full'].includes(style))
      throw new RangeError('Invalid date/time style.')
  const defaults = options.dateStyle === undefined && options.timeStyle === undefined
  return {
    locale,
    timeZone: options.timeZone,
    dateStyle: defaults ? ('medium' as const) : options.dateStyle,
    timeStyle: defaults ? ('short' as const) : options.timeStyle,
  }
}
