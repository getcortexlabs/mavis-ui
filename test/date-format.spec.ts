import { describe, expect, it } from 'vitest'
import {
  formatDateInput,
  parseDateInput,
  validateDateInput,
  validateDateRangeInput,
  dateInputPlaceholder,
} from '../packages/core/src/date-input.js'
import { formatDateTime, dateTimeToCivilDate } from '../packages/web/src/date-format.js'

describe('explicit date presentation', () => {
  it('round trips civil dates with a declared numeric grammar and no timezone conversion', () => {
    expect(formatDateInput('2026-11-03', 'locale', 'pt-BR')).toBe('03/11/2026')
    expect(formatDateInput('2026-11-03', 'locale', 'en-US')).toBe('11/03/2026')
    expect(parseDateInput('03/11/2026', 'locale', 'pt-BR')).toBe('2026-11-03')
    expect(parseDateInput('03/11/2026', 'locale', 'en-US')).toBe('2026-03-11')
    expect(formatDateInput('0001-01-01', 'dd/MM/yyyy')).toBe('01/01/0001')
    expect(parseDateInput('29/02/2024', 'dd/MM/yyyy')).toBe('2024-02-29')
    for (const value of ['29/02/2025', '3/11/2026', ' 03/11/2026', '2026-11-03', '03/11/0000'])
      expect(parseDateInput(value, 'dd/MM/yyyy')).toBeNull()
    expect(dateInputPlaceholder('locale', 'pt-BR')).toBe('DD/MM/AAAA')
  })
  it('retains incomplete drafts and evaluates constraints and ranges in canonical order', () => {
    expect(validateDateInput('03/11/', {}, 'locale', 'pt-BR').reason).toBe('incomplete')
    expect(validateDateInput('03/11/2026', { min: '2026-11-04' }, 'locale', 'pt-BR').reason).toBe(
      'before-min',
    )
    expect(
      validateDateRangeInput({ start: '30/11/2026', end: '01/12/2026' }, {}, 'dd/MM/yyyy', 'pt-BR')
        .valid,
    ).toBe(true)
    expect(
      validateDateRangeInput({ start: '01/12/2026', end: '30/11/2026' }, {}, 'dd/MM/yyyy', 'pt-BR')
        .reason,
    ).toBe('reversed')
  })
  it('formats an instant with explicit timezone and locale, including DST transitions', () => {
    const options = { timeZone: 'America/New_York', locale: 'en-US', timeStyle: 'short' as const }
    expect(formatDateTime(new Date('2026-03-08T06:30:00Z'), options)).toMatch(/1:30/)
    expect(formatDateTime(new Date('2026-03-08T07:30:00Z'), options)).toMatch(/3:30/)
    expect(
      formatDateTime(new Date('2026-11-03T01:30:00Z'), {
        timeZone: 'America/Sao_Paulo',
        locale: 'pt-BR',
        dateStyle: 'short',
      }),
    ).toBe('02/11/2026')
  })
  it('converts instants to a day explicitly and rejects ambiguous or invalid inputs', () => {
    const instant = new Date('2026-11-03T01:30:00Z')
    expect(dateTimeToCivilDate(instant, { timeZone: 'UTC' })).toBe('2026-11-03')
    expect(dateTimeToCivilDate(instant, { timeZone: 'America/Sao_Paulo' })).toBe('2026-11-02')
    expect(dateTimeToCivilDate(new Date('0001-01-01T12:00:00Z'), { timeZone: 'UTC' })).toBe(
      '0001-01-01',
    )
    expect(() => formatDateTime(new Date(NaN), { timeZone: 'UTC' })).toThrow()
    expect(() => formatDateTime(instant, { timeZone: 'Not/AZone' })).toThrow()
    expect(() => formatDateTime('2026-11-03' as never, { timeZone: 'UTC' })).toThrow()
    expect(() => formatDateTime(instant, {} as never)).toThrow()
  })
})
