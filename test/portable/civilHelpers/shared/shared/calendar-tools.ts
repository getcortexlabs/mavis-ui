import {
  civilDate,
  isCivilDate,
  daysInMonth,
  civilWeekday,
  addCivilDays,
  addCivilMonths,
} from '@getcortexlabs/mavis-core'

export function calendarSummary(value: string, days: number): string {
  try {
    const date = civilDate(value)
    const next = addCivilDays(date, days)
    const month = addCivilMonths(date, 1)
    const weekday = civilWeekday(date)
    return `${next}; ${month}; weekday ${weekday}`
  } catch {
    return 'Rejected civil date or offset'
  }
}
export function leapSummary(): string {
  return `Leap ${daysInMonth(2000, 2)}, century ${daysInMonth(1900, 2)}; valid ${isCivilDate('2024-02-29')}; invalid ${isCivilDate('2023-02-29')}`
}
