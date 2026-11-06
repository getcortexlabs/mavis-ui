/** Formatting options supported by both platform formatters and Intl. */
export interface NumberFlowFormat {
  style?: 'decimal' | 'currency' | 'percent'
  currency?: string
  currencyDisplay?: 'symbol' | 'code'
  useGrouping?: boolean
  minimumIntegerDigits?: number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function resolveNumberFlowFormat(options: NumberFlowFormat = {}): NumberFlowFormat {
  const allowed = new Set([
    'style',
    'currency',
    'currencyDisplay',
    'useGrouping',
    'minimumIntegerDigits',
    'minimumFractionDigits',
    'maximumFractionDigits',
  ])
  for (const key of Object.keys(options))
    if (!allowed.has(key))
      throw new RangeError(
        `Unsupported number format option: ${key}. Use formatValue for custom formatting.`,
      )
  const style = options.style ?? 'decimal'
  if (!['decimal', 'currency', 'percent'].includes(style))
    throw new RangeError('Unknown number format style.')
  if (style === 'currency' && !/^[a-z]{3}$/i.test(options.currency ?? ''))
    throw new RangeError('Currency formatting requires a three-letter currency code.')
  if (
    options.currencyDisplay !== undefined &&
    !['symbol', 'code'].includes(options.currencyDisplay)
  )
    throw new RangeError('currencyDisplay must be symbol or code.')
  if (options.useGrouping !== undefined && typeof options.useGrouping !== 'boolean')
    throw new RangeError('useGrouping must be a boolean.')
  for (const [key, min, max] of [
    ['minimumIntegerDigits', 1, 21],
    ['minimumFractionDigits', 0, 20],
    ['maximumFractionDigits', 0, 20],
  ] as const) {
    const value = options[key]
    if (value !== undefined && (!Number.isInteger(value) || value < min || value > max))
      throw new RangeError(`${key} must be an integer from ${min} to ${max}.`)
  }
  if (
    options.minimumFractionDigits !== undefined &&
    options.maximumFractionDigits !== undefined &&
    options.minimumFractionDigits > options.maximumFractionDigits
  )
    throw new RangeError('minimumFractionDigits cannot exceed maximumFractionDigits.')
  return {
    ...options,
    style,
    ...(options.currency ? { currency: options.currency.toUpperCase() } : {}),
  }
}

export function numberFlowFractionDigits(options: NumberFlowFormat, currencyDigits = 2) {
  const defaults =
    options.style === 'currency' ? Math.max(0, currencyDigits) : options.style === 'percent' ? 0 : 3
  const minimum =
    options.minimumFractionDigits ??
    Math.min(options.style === 'currency' ? defaults : 0, options.maximumFractionDigits ?? defaults)
  return { minimum, maximum: options.maximumFractionDigits ?? Math.max(minimum, defaults) }
}
