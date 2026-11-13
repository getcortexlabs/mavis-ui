import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { calendarSummary, leapSummary } from './portable/civilHelpersVue/shared/calendar-tools.js'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler source is native ESM.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

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

  it('compiles both formats using the same existing Gregorian policy and caught errors', async () => {
    const outputs = await Promise.all(
      ['civilHelpers', 'civilHelpersVue'].map(async (name) =>
        compileProject(await readShared(join(import.meta.dirname, 'portable', name)), {
          root: 'CivilHelpers',
        }),
      ),
    )
    const [tsx, vue] = outputs
    for (const file of ['CalendarToolsModule.swift', 'CivilHelpers.swift'])
      expect(tsx.swift.get(file).split('\n').slice(1)).toEqual(
        vue.swift.get(file).split('\n').slice(1),
      )
    expect(vue.swift.get('CalendarToolsModule.swift')).toContain(
      '(try mavisSharedAddCivilDays(date, days))',
    )
    expect(vue.swift.get('CalendarToolsModule.swift')).toContain('} catch {')
    expect(vue.swift.get('MavisValues.swift')).toContain('mavisAddCivilMonths(value, amount)')
    expect(vue.swift.get('MavisValues.swift')).not.toContain('try!')
  })

  it('requires explicit source error handling and diagnoses unrelated core APIs', async () => {
    const compile = (source: string) =>
      compileProject(
        new Map([
          ['shared/dates.ts', source],
          [
            'shared/Home.lite.tsx',
            'export default function Home() { return <MText>Dates</MText> }',
          ],
        ]),
        { root: 'Home' },
      )
    await expect(
      compile(
        "import { civilDate } from '@getcortexlabs/mavis-core'; export function date(value: string): string { return civilDate(value) }",
      ),
    ).rejects.toThrow('inside try/catch')
    await expect(
      compile(
        "import { dateLocales } from '@getcortexlabs/mavis-core'; export const labels = dateLocales",
      ),
    ).rejects.toThrow('civil-date helpers')
    await expect(
      compile(
        "import { civilDate } from '@getcortexlabs/mavis-core'; export const date = civilDate('2024-01-01')",
      ),
    ).rejects.toThrow('shared calculation with try/catch')
    await expect(
      compile(
        "import { civilDate } from '@getcortexlabs/mavis-core'; export function dates(values: string[]): string[] { try { return values.map(value => civilDate(value)) } catch { return [] } }",
      ),
    ).rejects.toThrow('inside this array callback')
  })
})
