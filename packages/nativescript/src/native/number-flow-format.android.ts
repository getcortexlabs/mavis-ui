import { numberFlowFractionDigits, type NumberFlowFormat } from '@getcortexlabs/mavis-core'

interface Currency {
  getDefaultFractionDigits(): number
}
interface Symbols {
  setCurrencySymbol(symbol: string): void
}
interface Formatter {
  setCurrency(currency: Currency): void
  setGroupingUsed(value: boolean): void
  setMinimumIntegerDigits(value: number): void
  setMinimumFractionDigits(value: number): void
  setMaximumFractionDigits(value: number): void
  setRoundingMode(value: unknown): void
  getDecimalFormatSymbols(): Symbols
  setDecimalFormatSymbols(value: Symbols): void
  format(value: number): string
}
declare const java: {
  util: {
    Locale: { forLanguageTag(locale: string): unknown }
    Currency: { getInstance(code: string): Currency }
  }
  math: { RoundingMode: { HALF_UP: unknown } }
  text: {
    NumberFormat: {
      getNumberInstance(locale: unknown): Formatter
      getCurrencyInstance(locale: unknown): Formatter
      getPercentInstance(locale: unknown): Formatter
    }
  }
}

export function numberFlowFormatter(locale: string, options: NumberFlowFormat) {
  const language = java.util.Locale.forLanguageTag(locale)
  const factory = java.text.NumberFormat
  const formatter =
    options.style === 'currency'
      ? factory.getCurrencyInstance(language)
      : options.style === 'percent'
        ? factory.getPercentInstance(language)
        : factory.getNumberInstance(language)
  const currency =
    options.style === 'currency' ? java.util.Currency.getInstance(options.currency!) : undefined
  if (currency) {
    formatter.setCurrency(currency)
    if (options.currencyDisplay === 'code') {
      const symbols = formatter.getDecimalFormatSymbols()
      symbols.setCurrencySymbol(options.currency!)
      formatter.setDecimalFormatSymbols(symbols)
    }
  }
  formatter.setGroupingUsed(options.useGrouping ?? true)
  formatter.setMinimumIntegerDigits(options.minimumIntegerDigits ?? 1)
  const digits = numberFlowFractionDigits(options, currency?.getDefaultFractionDigits())
  formatter.setMinimumFractionDigits(digits.minimum)
  formatter.setMaximumFractionDigits(digits.maximum)
  formatter.setRoundingMode(java.math.RoundingMode.HALF_UP)
  return (value: number) => String(formatter.format(value))
}
