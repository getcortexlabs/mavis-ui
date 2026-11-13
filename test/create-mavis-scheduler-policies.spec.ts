import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { civilDate } from '../packages/core/src/date'
import {
  changeSchedulerEvent,
  schedulerInstant,
  schedulerLayout,
  schedulerOffset,
  type SchedulerClock,
  type SchedulerDisambiguation,
  type SchedulerEvent,
  type SchedulerChange,
} from '../packages/core/src/scheduler'
// @ts-expect-error The portable compiler ships JavaScript in the template.
import { datePolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/date-policy.mjs'
// @ts-expect-error The portable compiler ships JavaScript in the template.
import { schedulerPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/scheduler-policy.mjs'
const swift = process.platform === 'darwin' && spawnSync('swiftc', ['--version']).status === 0
const q = (value: string) => JSON.stringify(value)
const event = (value: SchedulerEvent) =>
  `MavisSchedulerEvent(id: ${q(value.id)}, title: ${q(value.title)}, start: ${value.start}, end: ${value.end}, color: ${value.color ? q(value.color) : 'nil'}, disabled: ${value.disabled ?? false})`
const events = (values: SchedulerEvent[]) => `[${values.map(event).join(',')}]`
const clock: SchedulerClock = {
  parts(instant, timeZone) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(instant)
        .map((p) => [p.type, p.value]),
    )
    return {
      date: civilDate(`${parts.year!.padStart(4, '0')}-${parts.month}-${parts.day}`),
      minute: Number(parts.hour) * 60 + Number(parts.minute),
    }
  },
}
function run(calls: string[]) {
  const source = `import Foundation\n${datePolicy}\n${schedulerPolicy}\nfunc record(_ value: MavisSchedulerEvent) -> [String:Any] { ["id":value.id,"start":value.start,"end":value.end] }\nfunc layout(_ values: [MavisSchedulerDay]) -> [[String:Any]] { values.map { day in ["date":day.date,"segments":day.segments.map { value in ["id":value.event.id,"day":value.day,"top":value.top,"bottom":value.bottom,"lane":value.lane,"lanes":value.lanes,"startsHere":value.startsHere,"endsHere":value.endsHere] as [String:Any] }] } }\nfunc attempt(_ call: () throws -> Any) -> [String:Any] { do { return ["value":try call()] } catch { return ["error":error.localizedDescription] } }\nfunc show(_ value: Any) { print(String(data:try! JSONSerialization.data(withJSONObject:value,options:[.fragmentsAllowed,.sortedKeys]),encoding:.utf8)!) }\n${calls.map((call) => `show(attempt { ${call} })`).join('\n')}`
  const path = join(
      new URL('..', import.meta.url).pathname,
      'artifacts/portable/scheduler-policies',
      createHash('sha256').update(source).digest('hex').slice(0, 20),
    ),
    binary = join(path, 'policies')
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
const attempt = (action: () => unknown) => {
  try {
    return { value: action() }
  } catch (error) {
    return { error: (error as Error).message }
  }
}
describe('Swift scheduler policies agree with the shared core', () => {
  it.runIf(swift)(
    'resolves IANA zones, rejects gaps, disambiguates repeats and displays offsets independently of the host zone',
    () => {
      const calls: string[] = [],
        expected: unknown[] = []
      for (const [zone, date, minutes] of [
        ['America/New_York', '2026-03-08', [90, 120, 150, 180]],
        ['America/New_York', '2026-11-01', [30, 60, 90, 120]],
        ['Australia/Lord_Howe', '2026-04-05', [60, 90, 105, 120]],
        ['Australia/Lord_Howe', '2026-10-04', [90, 120, 135, 150]],
        ['Asia/Kolkata', '2026-03-08', [0, 600, 1439]],
        ['Pacific/Kiritimati', '2026-12-31', [0, 600, 1439]],
        ['UTC', '2024-02-29', [0, 600, 1439]],
      ] as [string, string, number[]][])
        for (const minute of minutes)
          for (const choice of ['reject', 'earlier', 'later'] as SchedulerDisambiguation[]) {
            calls.push(
              `try mavisSchedulerInstant(MavisSchedulerCivil(date:${q(date)},minute:${minute}),${q(zone)},${q(choice)})`,
            )
            expected.push(
              attempt(() =>
                schedulerInstant({ date: civilDate(date), minute }, zone, clock, choice),
              ),
            )
          }
      for (const zone of ['UTC', 'Asia/Kolkata', 'America/New_York', 'Australia/Lord_Howe'])
        for (const instant of [
          Date.parse('2026-03-08T06:30:00Z'),
          Date.parse('2026-03-08T07:30:00Z'),
          Date.parse('2026-11-01T05:30:00Z'),
          Date.parse('2026-11-01T06:30:00Z'),
          -1,
        ]) {
          calls.push(`try mavisSchedulerOffset(${instant},${q(zone)})`)
          expected.push(attempt(() => schedulerOffset(instant, zone, clock)))
        }
      for (const actual of run(calls)) expect(actual).toEqual(expected)
    },
    120_000,
  )
  it.runIf(swift)(
    'splits days, assigns collision lanes, keeps repeated-hour duration and rejects invalid edits',
    () => {
      const calls: string[] = [],
        expected: unknown[] = []
      const session = (
        id: string,
        start: string,
        end: string,
        disabled = false,
      ): SchedulerEvent => ({
        id,
        title: id,
        start: Date.parse(start),
        end: Date.parse(end),
        disabled,
      })
      const collections: SchedulerEvent[][] = [
        [
          session('a', '2026-03-07T09:00Z', '2026-03-07T11:00Z'),
          session('b', '2026-03-07T09:30Z', '2026-03-07T10:00Z'),
          session('c', '2026-03-07T10:00Z', '2026-03-07T12:00Z'),
        ],
        [session('overnight', '2026-03-06T23:00Z', '2026-03-08T00:00Z')],
        [
          session('z', '2026-03-07T09:00Z', '2026-03-07T10:00Z'),
          session('a', '2026-03-07T09:00Z', '2026-03-07T10:00Z'),
        ],
        [session('repeat', '2026-11-01T05:45Z', '2026-11-01T06:15Z')],
        [],
      ]
      for (const values of collections)
        for (const zone of ['UTC', 'America/New_York'])
          for (const days of [1, 7]) {
            const date = values[0]?.id === 'repeat' ? '2026-11-01' : '2026-03-07'
            calls.push(
              `layout(try mavisSchedulerLayout(${events(values)},${q(date)},${days},${q(zone)},0,24))`,
            )
            expected.push(
              attempt(() =>
                schedulerLayout(values, civilDate(date), days, zone, clock).map((day) => ({
                  date: day.date,
                  segments: day.segments.map(
                    ({ event, day, top, bottom, lane, lanes, startsHere, endsHere }) => ({
                      id: event.id,
                      day,
                      top,
                      bottom,
                      lane,
                      lanes,
                      startsHere,
                      endsHere,
                    }),
                  ),
                })),
              ),
            )
          }
      const values = [
        session('open', '2026-03-07T10:00Z', '2026-03-07T12:00Z'),
        session('locked', '2026-03-07T10:00Z', '2026-03-07T12:00Z', true),
      ]
      for (const change of [
        { id: 'open', start: values[0]!.start + 60000, end: values[0]!.end + 60000, kind: 'move' },
        { id: 'locked', start: 0, end: 60000, kind: 'move' },
        { id: 'open', start: 1, end: 1, kind: 'resize' },
        { id: 'missing', start: 0, end: 60000, kind: 'move' },
      ] as SchedulerChange[]) {
        calls.push(
          `try mavisChangeScheduler(${events(values)},MavisSchedulerChange(id:${q(change.id)},start:${change.start},end:${change.end},kind:${q(change.kind)})).map(record)`,
        )
        expected.push(
          attempt(() =>
            changeSchedulerEvent(values, change).map(({ id, start, end }) => ({ id, start, end })),
          ),
        )
      }
      for (const actual of run(calls)) expect(actual).toEqual(expected)
    },
    120_000,
  )
})
