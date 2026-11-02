export type NumberLocale = 'en-US' | 'pt-BR'
export type NumberDraft =
  | { status: 'valid'; value: number }
  | { status: 'empty'; value: null }
  | { status: 'incomplete' | 'invalid' | 'range'; value: null }

export interface NumberConstraints {
  min?: number
  max?: number
  step: number
}

export function validateNumberConstraints({ min, max, step }: NumberConstraints) {
  if (!Number.isFinite(step) || step <= 0) throw new RangeError('step must be finite and positive.')
  if ([min, max].some((value) => value !== undefined && !Number.isFinite(value)))
    throw new RangeError('Numeric bounds must be finite.')
  if (min !== undefined && max !== undefined && min > max)
    throw new RangeError('min must not exceed max.')
}

export function formatNumber(value: number | null, locale: NumberLocale) {
  if (value === null) return ''
  if (!Number.isFinite(value)) throw new RangeError('NumberInput requires a finite number or null.')
  const [coefficient, exponent] = String(value).split('e')
  let text = coefficient!
  if (exponent) {
    const negative = text.startsWith('-')
    const [whole, fraction = ''] = text.replace('-', '').split('.')
    const digits = whole! + fraction
    const point = whole!.length + Number(exponent)
    text =
      point <= 0
        ? `0.${'0'.repeat(-point)}${digits}`
        : point >= digits.length
          ? digits + '0'.repeat(point - digits.length)
          : `${digits.slice(0, point)}.${digits.slice(point)}`
    if (negative) text = `-${text}`
  }
  return locale === 'pt-BR' ? text.replace('.', ',') : text
}

export function parseNumberDraft(
  text: string,
  locale: NumberLocale,
  bounds: NumberConstraints,
): NumberDraft {
  const value = text.trim()
  if (!value) return { status: 'empty', value: null }
  const normalized = locale === 'pt-BR' ? value.replace(',', '.') : value
  if (/^[+-]?$/.test(normalized) || /^[+-]?(?:\d+)?\.$/.test(normalized))
    return { status: 'incomplete', value: null }
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return { status: 'invalid', value: null }
  const number = Number(normalized)
  if (!Number.isFinite(number)) return { status: 'invalid', value: null }
  if (
    (bounds.min !== undefined && number < bounds.min) ||
    (bounds.max !== undefined && number > bounds.max)
  )
    return { status: 'range', value: null }
  return { status: 'valid', value: number }
}

export function stepNumber(value: number | null, direction: -1 | 1, bounds: NumberConstraints) {
  validateNumberConstraints(bounds)
  const base = value ?? Math.max(bounds.min ?? 0, Math.min(0, bounds.max ?? 0))
  // Scale ordinary decimal steps only while the integer arithmetic remains exact.
  // Large or very small values retain JavaScript number precision without rounding to 15 digits.
  const decimals = (number: number) => formatNumber(number, 'en-US').split('.')[1]?.length ?? 0
  const factor = 10 ** Math.max(decimals(base), decimals(bounds.step))
  const scaledBase = Math.round(base * factor),
    scaledStep = Math.round(bounds.step * factor)
  const scaledNext = scaledBase + direction * scaledStep
  const next = [scaledBase, scaledStep, scaledNext].every(Number.isSafeInteger)
    ? scaledNext / factor
    : base + direction * bounds.step
  return Math.max(
    bounds.min ?? -Infinity,
    Math.min(bounds.max ?? Infinity, Number.isFinite(next) ? next : base),
  )
}
