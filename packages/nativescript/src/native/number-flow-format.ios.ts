import { numberFlowFractionDigits, type NumberFlowFormat } from '@getcortexlabs/mavis-core'

declare const NSLocale: { alloc(): { initWithLocaleIdentifier(locale: string): unknown } }
declare const NSNumber: { numberWithDouble(value: number): unknown }
declare const NSNumberFormatter: {
  new: () => {
    locale: unknown
    numberStyle: number
    currencyCode: string
    usesGroupingSeparator: boolean
    minimumIntegerDigits: number
    minimumFractionDigits: number
    maximumFractionDigits: number
    roundingMode: number
    stringFromNumber(value: unknown): string | null
  }
}

export function numberFlowFormatter(locale: string, options: NumberFlowFormat) {
  const formatter = NSNumberFormatter.new()
  formatter.locale = NSLocale.alloc().initWithLocaleIdentifier(locale)
  formatter.numberStyle =
    options.style === 'currency'
      ? options.currencyDisplay === 'code'
        ? 8
        : 2
      : options.style === 'percent'
        ? 3
        : 1
  if (options.currency) formatter.currencyCode = options.currency
  formatter.usesGroupingSeparator = options.useGrouping ?? true
  formatter.minimumIntegerDigits = options.minimumIntegerDigits ?? 1
  const digits = numberFlowFractionDigits(options, formatter.maximumFractionDigits)
  formatter.minimumFractionDigits = digits.minimum
  formatter.maximumFractionDigits = digits.maximum
  // Foundation HalfUp matches Intl's default ties away from zero.
  formatter.roundingMode = 6
  return (value: number) =>
    formatter.stringFromNumber(NSNumber.numberWithDouble(value)) ?? String(value)
}
