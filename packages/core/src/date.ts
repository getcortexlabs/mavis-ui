/** A proleptic Gregorian civil date, never a timestamp. Runtime APIs validate YYYY-MM-DD. */
export type CivilDate = `${number}-${number}-${number}`
export type DateLocale = 'en-US' | 'pt-BR'
export interface DateRange {
  start: CivilDate | null
  end: CivilDate | null
}
export interface DateRangeDraft {
  start: string
  end: string
}
export interface DateConstraints {
  min?: CivilDate
  max?: CivilDate
  unavailableDates?: readonly CivilDate[]
}
export type DateValidationReason =
  | 'empty'
  | 'partial'
  | 'incomplete'
  | 'invalid'
  | 'before-min'
  | 'after-max'
  | 'unavailable'
  | 'reversed'
  | 'unavailable-range'
  | null
export interface DateValidation {
  /** Empty values and ranges with one empty endpoint are valid; required belongs to the app. */
  valid: boolean
  complete: boolean
  reason: DateValidationReason
}
export interface CivilDateParts {
  year: number
  month: number
  day: number
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export function parseCivilDate(value: unknown): CivilDateParts | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
    ? { year, month, day }
    : null
}

export function isCivilDate(value: unknown): value is CivilDate {
  return parseCivilDate(value) !== null
}

export function civilDate(value: string): CivilDate {
  if (!isCivilDate(value))
    throw new RangeError('A civil date must be Gregorian YYYY-MM-DD (0001–9999)')
  return value
}

export function formatCivilDate({ year, month, day }: CivilDateParts): CivilDate {
  return civilDate(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  )
}

function daysBeforeYear(year: number) {
  const previous = year - 1
  return (
    365 * previous +
    Math.floor(previous / 4) -
    Math.floor(previous / 100) +
    Math.floor(previous / 400)
  )
}
function ordinal(value: CivilDate): number {
  const parts = parseCivilDate(value)
  if (!parts) throw new RangeError('Invalid civil date')
  let result = daysBeforeYear(parts.year) + parts.day - 1
  for (let month = 1; month < parts.month; month++) result += daysInMonth(parts.year, month)
  return result
}

/** Sunday=0. Uses Gregorian arithmetic and is independent of host time zone and DST. */
export function civilWeekday(value: CivilDate): number {
  return (ordinal(value) + 1) % 7
}

/** Calendar navigation clamps at the supported years, never wrapping to another era. */
export function addCivilDays(value: CivilDate, amount: number): CivilDate {
  if (!Number.isSafeInteger(amount)) throw new RangeError('Day offset must be an integer')
  const target = Math.max(0, Math.min(daysBeforeYear(10000) - 1, ordinal(value) + amount))
  let low = 1
  let high = 9999
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (daysBeforeYear(middle) <= target) low = middle
    else high = middle - 1
  }
  let day = target - daysBeforeYear(low) + 1
  let month = 1
  while (day > daysInMonth(low, month)) day -= daysInMonth(low, month++)
  return formatCivilDate({ year: low, month, day })
}

export function addCivilMonths(value: CivilDate, amount: number): CivilDate {
  if (!Number.isSafeInteger(amount)) throw new RangeError('Month offset must be an integer')
  const parts = parseCivilDate(value)
  if (!parts) throw new RangeError('Invalid civil date')
  const target = Math.max(
    0,
    Math.min(9999 * 12 - 1, (parts.year - 1) * 12 + parts.month - 1 + amount),
  )
  const year = Math.floor(target / 12) + 1
  const month = (target % 12) + 1
  return formatCivilDate({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) })
}

export function validateDateConstraints(options: DateConstraints) {
  if (options.min !== undefined) civilDate(options.min)
  if (options.max !== undefined) civilDate(options.max)
  if (options.min && options.max && options.min > options.max)
    throw new RangeError('Date min must not be after max')
  for (const value of options.unavailableDates ?? []) civilDate(value)
}

export function dateAvailability(value: CivilDate, options: DateConstraints): DateValidationReason {
  if (options.min && value < options.min) return 'before-min'
  if (options.max && value > options.max) return 'after-max'
  if (options.unavailableDates?.includes(value)) return 'unavailable'
  return null
}

export function validateDateDraft(value: string, options: DateConstraints = {}): DateValidation {
  validateDateConstraints(options)
  if (value === '') return { valid: true, complete: false, reason: 'empty' }
  if (!isCivilDate(value)) {
    // Prefixes describe editing, not a second parsing grammar. No trimming or locale guessing.
    const incomplete = /^\d{0,4}(-\d{0,2}(-\d{0,2})?)?$/.test(value) && value.length < 10
    return { valid: false, complete: false, reason: incomplete ? 'incomplete' : 'invalid' }
  }
  const reason = dateAvailability(value, options)
  return { valid: reason === null, complete: true, reason }
}

export function validateDateRangeDraft(
  draft: DateRangeDraft,
  options: DateConstraints = {},
): DateValidation {
  const start = validateDateDraft(draft.start, options)
  const end = validateDateDraft(draft.end, options)
  const complete = start.complete && end.complete
  if (!start.valid) return { ...start, complete }
  if (!end.valid) return { ...end, complete }
  if (!draft.start || !draft.end)
    return { valid: true, complete: false, reason: draft.start || draft.end ? 'partial' : 'empty' }
  if (draft.start > draft.end) return { valid: false, complete: true, reason: 'reversed' }
  if (options.unavailableDates?.some((date) => date >= draft.start && date <= draft.end))
    return { valid: false, complete: true, reason: 'unavailable-range' }
  return { valid: true, complete: true, reason: null }
}

export const dateLocales = {
  'en-US': {
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortWeekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    firstDayOfWeek: 0,
    calendar: 'Choose date',
    previous: 'Previous month',
    next: 'Next month',
    clear: 'Clear dates',
    selected: 'Selected',
    close: 'Close',
    start: 'Start',
    end: 'End',
    format: 'YYYY-MM-DD',
    errors: {
      incomplete: 'Enter a complete date as YYYY-MM-DD.',
      invalid: 'Enter a valid Gregorian date as YYYY-MM-DD.',
      'before-min': 'This date is before the minimum.',
      'after-max': 'This date is after the maximum.',
      unavailable: 'This date is unavailable.',
      reversed: 'The end must be on or after the start.',
      'unavailable-range': 'This range includes an unavailable date.',
    },
  },
  'pt-BR': {
    months: [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ],
    weekdays: [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
    ],
    shortWeekdays: ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá'],
    firstDayOfWeek: 0,
    calendar: 'Escolher data',
    previous: 'Mês anterior',
    next: 'Próximo mês',
    clear: 'Limpar datas',
    selected: 'Selecionada',
    close: 'Fechar',
    start: 'Início',
    end: 'Fim',
    format: 'AAAA-MM-DD',
    errors: {
      incomplete: 'Informe a data completa no formato AAAA-MM-DD.',
      invalid: 'Informe uma data gregoriana válida no formato AAAA-MM-DD.',
      'before-min': 'Esta data é anterior ao mínimo.',
      'after-max': 'Esta data é posterior ao máximo.',
      unavailable: 'Esta data não está disponível.',
      reversed: 'O fim deve ser igual ou posterior ao início.',
      'unavailable-range': 'Este intervalo inclui uma data indisponível.',
    },
  },
} as const

export function dateValidationMessage(validation: DateValidation, locale: DateLocale): string {
  return validation.valid
    ? ''
    : dateLocales[locale].errors[validation.reason as keyof (typeof dateLocales)['en-US']['errors']]
}

export function calendarMonth(
  value: CivilDate,
  firstDayOfWeek: number,
): readonly (CivilDate | null)[] {
  const parts = parseCivilDate(value)
  if (!parts) throw new RangeError('Invalid civil date')
  if (!Number.isInteger(firstDayOfWeek) || firstDayOfWeek < 0 || firstDayOfWeek > 6)
    throw new RangeError('firstDayOfWeek must be an integer from 0 to 6')
  const first = formatCivilDate({ ...parts, day: 1 })
  const offset = (civilWeekday(first) - firstDayOfWeek + 7) % 7
  const count = daysInMonth(parts.year, parts.month)
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1
    return day > 0 && day <= count ? formatCivilDate({ ...parts, day }) : null
  })
}

export function calendarDayLabel(value: CivilDate, locale: DateLocale): string {
  const parts = parseCivilDate(value)
  if (!parts) throw new RangeError('Invalid civil date')
  const words = dateLocales[locale]
  return `${words.weekdays[civilWeekday(value)]}, ${parts.day} ${words.months[parts.month - 1]} ${parts.year}`
}
