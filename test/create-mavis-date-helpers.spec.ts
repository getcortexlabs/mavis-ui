import { describe, expect, it } from 'vitest'
import { calendarSummary, leapSummary } from './portable/civilHelpersVue/shared/calendar-tools.js'

describe('civil helpers in shared calculations', () => {
  it('keeps civil days independent of DST and preserves leap years, bounds and failures', () => {
    expect(calendarSummary('2024-01-31', 1)).toBe('2024-02-01; 2024-02-29; weekday 3')
    expect(calendarSummary('2024-03-10', 1)).toBe('2024-03-11; 2024-04-10; weekday 0')
    expect(calendarSummary('0001-01-01', -1)).toBe('0001-01-01; 0001-02-01; weekday 1')
    expect(calendarSummary('9999-12-31', 1)).toBe('9999-12-31; 9999-12-31; weekday 5')
    expect(leapSummary()).toBe('Leap 29, century 28; valid true; invalid false')
    for (const [date, offset] of [
      ['2023-02-29', 0],
      ['2024-02-29\n', 0],
      ['0000-01-01', 1],
      ['2024-01-01', 0.5],
      ['2024-01-01', Infinity],
    ] as const)
      expect(calendarSummary(date, offset)).toBe('Rejected civil date or offset')
  })
})
