import {
  civilDate,
  isCivilDate,
  validateDateDraft,
  validateDateConstraints,
  validateDateRangeDraft,
  type CivilDate,
  type DateConstraints,
  type DateLocale,
  type DateRangeDraft,
  type DateValidation,
} from './date.js'

/** Deliberately bounded numeric editing grammars; no locale guessing or timestamp conversion. */
export type DateInputFormat = 'iso' | 'locale' | 'yyyy-MM-dd' | 'dd/MM/yyyy' | 'MM/dd/yyyy'
export function resolveDateInputFormat(format: DateInputFormat, locale: DateLocale) {
  if (format === 'iso' || format === 'yyyy-MM-dd') return 'yyyy-MM-dd'
  if (format === 'locale') return locale === 'pt-BR' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'
  if (format === 'dd/MM/yyyy' || format === 'MM/dd/yyyy') return format
  throw new RangeError(
    'Unsupported dateFormat. Use iso, locale, yyyy-MM-dd, dd/MM/yyyy or MM/dd/yyyy.',
  )
}
export function dateInputPlaceholder(format: DateInputFormat, locale: DateLocale): string {
  const pattern = resolveDateInputFormat(format, locale)
  return pattern.replace('yyyy', locale === 'pt-BR' ? 'AAAA' : 'YYYY').replace('dd', 'DD')
}
export function formatDateInput(
  value: CivilDate,
  format: DateInputFormat = 'iso',
  locale: DateLocale = 'en-US',
): string {
  civilDate(value)
  const [year, month, day] = value.split('-')
  return resolveDateInputFormat(format, locale)
    .replace('yyyy', year!)
    .replace('MM', month!)
    .replace('dd', day!)
}
export function parseDateInput(
  value: string,
  format: DateInputFormat = 'iso',
  locale: DateLocale = 'en-US',
): CivilDate | null {
  const pattern = resolveDateInputFormat(format, locale)
  if (pattern === 'yyyy-MM-dd') return isCivilDate(value) ? value : null
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const iso = `${match[3]}-${pattern === 'dd/MM/yyyy' ? match[2] : match[1]}-${pattern === 'dd/MM/yyyy' ? match[1] : match[2]}`
  return isCivilDate(iso) ? iso : null
}
export function validateDateInput(
  value: string,
  options: DateConstraints,
  format: DateInputFormat,
  locale: DateLocale,
): DateValidation {
  validateDateConstraints(options)
  const pattern = resolveDateInputFormat(format, locale)
  const parsed = parseDateInput(value, format, locale)
  if (!value || parsed) return validateDateDraft(parsed ?? '', options)
  const incomplete =
    value.length < 10 &&
    (pattern === 'yyyy-MM-dd'
      ? /^\d{0,4}(-\d{0,2}(-\d{0,2})?)?$/.test(value)
      : /^\d{0,2}(\/\d{0,2}(\/\d{0,4})?)?$/.test(value))
  return { valid: false, complete: false, reason: incomplete ? 'incomplete' : 'invalid' }
}
export function validateDateRangeInput(
  draft: DateRangeDraft,
  options: DateConstraints,
  format: DateInputFormat,
  locale: DateLocale,
): DateValidation {
  const start = validateDateInput(draft.start, options, format, locale)
  const end = validateDateInput(draft.end, options, format, locale)
  const complete = start.complete && end.complete
  if (!start.valid) return { ...start, complete }
  if (!end.valid) return { ...end, complete }
  return validateDateRangeDraft(
    {
      start: parseDateInput(draft.start, format, locale) ?? '',
      end: parseDateInput(draft.end, format, locale) ?? '',
    },
    options,
  )
}
