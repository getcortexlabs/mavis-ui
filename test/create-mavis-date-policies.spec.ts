import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  addCivilDays,
  addCivilMonths,
  calendarMonth,
  civilDate,
  civilWeekday,
  validateDateConstraints,
  type DateConstraints,
} from '../packages/core/src/date'
import {
  formatDateInput,
  parseDateInput,
  validateDateInput,
  validateDateRangeInput,
  type DateInputFormat,
} from '../packages/core/src/date-input'
// @ts-expect-error The portable compiler is shipped as JavaScript in the template.
import { datePolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/date-policy.mjs'
const swift = process.platform === 'darwin' && spawnSync('swiftc', ['--version']).status === 0
const root = new URL('..', import.meta.url).pathname
const q = (value: string) => JSON.stringify(value)
const maybe = (value: string | undefined) => (value === undefined ? 'nil' : q(value))
const options = (value: DateConstraints) =>
  `MavisDateConstraints(min: ${maybe(value.min)}, max: ${maybe(value.max)}, unavailable: [${value.unavailableDates?.map(q).join(',') ?? ''}])`
function run(calls: string[]) {
  const source = `import Foundation\n${datePolicy}\nfunc show(_ value: Any) { print(String(data: try! JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed,.sortedKeys]), encoding: .utf8)!) }\nfunc validity(_ value: MavisDateValidation) -> [String:Any] { ["valid":value.valid,"complete":value.complete,"reason":value.reason.map { $0 as Any } ?? NSNull()] }\n${calls.map((call) => `show(${call})`).join('\n')}`
  const path = join(
    root,
    'artifacts/portable/date-policies',
    createHash('sha256').update(source).digest('hex').slice(0, 20),
  )
  const binary = join(path, 'policies')
  if (!existsSync(binary)) {
    mkdirSync(path, { recursive: true })
    writeFileSync(join(path, 'main.swift'), source)
    execFileSync('swiftc', ['main.swift', '-o', 'policies'], {
      cwd: path,
      stdio: 'pipe',
      timeout: 90_000,
    })
  }
  return ['UTC', 'America/Sao_Paulo', 'Pacific/Kiritimati'].map((TZ) =>
    execFileSync(binary, { env: { ...process.env, TZ }, encoding: 'utf8', timeout: 10_000 })
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line)),
  )
}
describe('civil dates in generated Swift agree with the shared core', () => {
  it.runIf(swift)(
    'handles Gregorian boundaries, leap days, month grids, local input drafts and range constraints independently of host time zone',
    () => {
      const calls: string[] = [],
        expected: unknown[] = []
      for (const raw of [
        '0001-01-01',
        '0099-12-31',
        '1600-02-29',
        '1900-02-28',
        '2000-02-29',
        '2024-02-29',
        '2024-03-10',
        '2024-11-03',
        '9999-12-31',
      ]) {
        const date = civilDate(raw)
        calls.push(`mavisCivilWeekday(${q(date)})`)
        expected.push(civilWeekday(date))
        for (const delta of [-9007199254740991, -400, -31, -1, 0, 1, 31, 400, 9007199254740991]) {
          calls.push(`mavisAddCivilDays(${q(date)}, ${delta}).map { $0 as Any } ?? NSNull()`)
          expected.push(addCivilDays(date, delta))
          calls.push(`mavisAddCivilMonths(${q(date)}, ${delta}).map { $0 as Any } ?? NSNull()`)
          expected.push(addCivilMonths(date, delta))
        }
        for (const start of [0, 1, 6]) {
          calls.push(
            `mavisCalendarMonth(${q(date)}, ${start})!.map { $0.map { $0 as Any } ?? NSNull() }`,
          )
          expected.push(calendarMonth(date, start))
        }
        for (const format of [
          'iso',
          'locale',
          'yyyy-MM-dd',
          'dd/MM/yyyy',
          'MM/dd/yyyy',
        ] as DateInputFormat[])
          for (const locale of ['en-US', 'pt-BR'] as const) {
            calls.push(`mavisFormatDateInput(${q(date)}, ${q(format)}, ${q(locale)})!`)
            expected.push(formatDateInput(date, format, locale))
          }
      }
      const constraints: DateConstraints = {
        min: '2024-02-01',
        max: '2024-03-31',
        unavailableDates: ['2024-02-29'],
      }
      for (const format of ['iso', 'locale', 'dd/MM/yyyy', 'MM/dd/yyyy'] as DateInputFormat[])
        for (const locale of ['en-US', 'pt-BR'] as const)
          for (const text of [
            '',
            '2',
            '2024-',
            '2024-02-',
            '2024-02-28',
            '2024-02-29',
            '2024-02-30',
            '2024-04-01',
            '28/02/2024',
            '02/28/2024',
            ' 2024-02-28',
            'no date',
            '31/02/2024',
          ]) {
            calls.push(
              `mavisParseDateInput(${q(text)}, ${q(format)}, ${q(locale)}).map { $0 as Any } ?? NSNull()`,
            )
            expected.push(parseDateInput(text, format, locale))
            calls.push(
              `validity(mavisValidateDateInput(${q(text)}, ${options(constraints)}, ${q(format)}, ${q(locale)}))`,
            )
            expected.push(validateDateInput(text, constraints, format, locale))
          }
      for (const [start, end] of [
        ['', ''],
        ['2024-02-28', ''],
        ['2024-02-', '2024-03-01'],
        ['2024-02-28', '2024-03-01'],
        ['2024-03-02', '2024-03-01'],
        ['2024-03-01', '2024-03-02'],
        ['2024-01-01', '2024-03-01'],
      ]) {
        calls.push(
          `validity(mavisValidateDateRange(${q(start!)}, ${q(end!)}, ${options(constraints)}))`,
        )
        expected.push(
          validateDateRangeInput({ start: start!, end: end! }, constraints, 'iso', 'en-US'),
        )
      }
      for (const constraints of [
        { min: '2024-02-30' },
        { min: '2024-03-01', max: '2024-02-28' },
        { unavailableDates: ['invalid'] },
        {},
      ] as DateConstraints[]) {
        calls.push(`${options(constraints)}.valid`)
        try {
          validateDateConstraints(constraints)
          expected.push(true)
        } catch {
          expected.push(false)
        }
      }
      for (const actual of run(calls)) expect(actual).toEqual(expected)
    },
    120_000,
  )
})
