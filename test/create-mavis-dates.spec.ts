import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { schedulerProps } from '../packages/core/src/vue/advanced-props'
import { calendarProps } from '../packages/core/src/vue/discovery-props'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler is shipped as JavaScript in the template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler is shipped as JavaScript in the template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
const root = new URL('./portable/', import.meta.url).pathname
const compile = (files: Record<string, string>) =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => ['shared/' + name, text])), {
    root: 'Home',
  })
const tsx = (view: string, state = "selected: '2024-02-28' as CivilDate") =>
  `import { useStore } from '@builder.io/mitosis'\nexport default function Home() { const state = useStore({ ${state} }); return (${view}) }`
const vue = (script: string, view: string) =>
  `<script setup lang="ts">import { ref } from 'vue'\n${script}\n</script><template>${view}</template>`
const plain = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )

describe('Mac date components', () => {
  it('uses only properties of the real calendar contract', () => {
    expect(
      Object.keys(components.MCalendar.props).filter(
        (prop) => !['value', 'onChange', 'onInvalid'].includes(prop) && !(prop in calendarProps),
      ),
    ).toEqual([])
  })
  it.each([
    ['calendar', 'Dates'],
    ['calendarRange', 'Stay'],
    ['dateEntry', 'Birthday'],
    ['dateRangeEntry', 'Trip'],
    ['timeEntry', 'Meeting'],
    ['schedule', 'Planner'],
    ['scheduleDST', 'Planner'],
  ])('generates the same %s model from TSX and original Vue', async (fixture, entry) => {
    const a = await compileProject(await readShared(join(root, fixture)), { root: entry })
    const b = await compileProject(await readShared(join(root, fixture + 'Vue')), { root: entry })
    expect(plain(a.model)).toEqual(plain(b.model))
    expect(
      a.swift
        .get(entry + '.swift')
        .split('\n')
        .slice(1),
    ).toEqual(
      b.swift
        .get(entry + '.swift')
        .split('\n')
        .slice(1),
    )
  })
  it('keeps the whole day button hittable when its animated selection paint is transparent', async () => {
    const result = await compileProject(await readShared(join(root, 'calendar')), { root: 'Dates' })
    const runtime = result.swift.get('MavisControls.swift')
    const grid = runtime.slice(
      runtime.indexOf('struct MavisCalendarGrid:'),
      runtime.indexOf('struct MavisCalendar<'),
    )
    expect(grid.includes('}.buttonStyle(.plain)\n            // An unselected')).toBe(true)
    expect(grid.includes('.contentShape([.interaction, .accessibility], Rectangle())')).toBe(true)
    expect(grid.includes('Button { if available { onSelect(date) } }')).toBe(true)
  })

  it('keeps the window observer out of calendar and picker input routing', async () => {
    const result = await compileProject(await readShared(join(root, 'dateEntry')), {
      root: 'Birthday',
    })
    const runtime = result.swift.get('MavisControls.swift')
    const reader = runtime.slice(
      runtime.indexOf('struct MavisWindowReader:'),
      runtime.indexOf('final class MavisModalFocus'),
    )
    expect(reader.includes('override func hitTest(_ point: NSPoint) -> NSView? { nil }')).toBe(true)
    expect(
      reader.includes('override func accessibilityHitTest(_ point: NSPoint) -> Any? { nil }'),
    ).toBe(true)
    expect(reader.includes('view.setAccessibilityElement(false)')).toBe(true)
    expect(reader.includes('box.view = view')).toBe(true)
  })

  it('keeps the range controlled, rejects unavailable interior dates and lowers a footer', async () => {
    const result = await compile({
      'Home.vue': vue(
        "import type { DateRange } from '#mavis'\nconst range = ref<DateRange>({ start: '2024-02-01', end: null })\nconst invalid = ref(false)",
        '<MCalendar mode="range" label="Stay" v-model="range" :unavailableDates="[\'2024-02-03\']" @invalid="invalid = true"><template #footer><MText>{{ invalid ? \'Choose another range\' : \'Pick an end\' }}</MText></template></MCalendar>',
      ),
    })
    expect(result.swift.get('Home.swift')).toContain(
      'MavisDateRange(start: self.range.start, end: self.range.end)',
    )
    expect(result.swift.get('Home.swift')).toContain('self.range = value')
    expect([...result.swift.values()].join('\n')).toContain(
      'mavisValidateDateRange(next.start!, next.end!, constraints)',
    )
    expect(result.direct).toEqual(['shared/Home.vue'])
  })
  it('uses Jolt for month and selection motion while keeping dates synchronous', async () => {
    const result = await compile({
      'Home.lite.tsx': tsx(
        '<MCalendar label="Day" value={state.selected} onChange={(value)=>state.selected=value} />',
      ),
    })
    const runtime = [...result.swift.values()].join('\n')
    expect(runtime).toContain('JoltMotionValue(1)')
    expect(runtime).toContain('.joltMotion(to: try! JoltPose(')
    expect(runtime).toContain('reducedMotion: reduced || !window.onScreen')
    expect(runtime).toContain('motion.cancel()')
  })
  it.each([
    ['firstDayOfWeek={7}', 'firstDayOfWeek must be an integer'],
    ['initialMonth="0000-02"', 'initialMonth must be in years'],
    ['locale="es-ES"', 'not assignable'],
  ])('rejects invalid date configuration %s', async (props, message) => {
    await expect(
      compile({ 'Home.lite.tsx': tsx(`<MCalendar label="Day" ${props} />`) }),
    ).rejects.toThrow(message)
  })
})

describe('Mac date editors', () => {
  it('preserves nullable models, draft events and validity payloads', async () => {
    const result = await compile({
      'Home.vue': vue(
        "import type { CivilDate } from '#mavis'\nconst date = ref<CivilDate | null>(null)\nconst draft = ref('')\nconst valid = ref(true)",
        '<MDatePicker label="Birthday" v-model="date" v-model:draft="draft" dateFormat="locale" locale="pt-BR" @validityChange="(value) => valid = value.valid" />',
      ),
    })
    const source = result.swift.get('Home.swift')
    expect(source).toContain('MavisDateEntry(')
    expect(source).toContain('self.date = value')
    expect(source).toContain('self.draft = value')
    expect(source).toContain(
      'DateValidation(valid: value.valid, complete: value.complete, reason: value.reason)',
    )
    expect(source).toContain('dateFormat: "locale"')
  })
  it('generates an empty uncontrolled editor and a controlled range without requiring listeners', async () => {
    const one = await compile({ 'Home.lite.tsx': tsx('<MDatePicker label="Birthday" />') })
    expect(one.swift.get('Home.swift')).toContain('value: MavisDateRange(start: nil)')
    const range = await compile({
      'Home.vue': vue(
        "import type { DateRange } from '#mavis'\nconst range = ref<DateRange>({ start: null, end: null })",
        '<MDateRangePicker label="Trip" :modelValue="range" startLabel="Arrival" endLabel="Departure" />',
      ),
    })
    expect(range.swift.get('Home.swift')).toContain('startLabel: "Arrival"')
    expect(range.swift.get('Home.swift')).toContain('range: true')
  })
})

describe('Mac time editor', () => {
  it('types nullable wall-clock values and full validity payloads', async () => {
    const result = await compile({
      'Home.vue': vue(
        "import type {LocalTime} from '#mavis'\nconst time=ref<LocalTime | null>('10:15')\nconst status=ref('none')",
        '<MTimePicker label="Meeting" v-model="time" locale="pt-BR" :minuteStep="15" min="09:00" max="18:00" @validityChange="value=>status=value.status"/>',
      ),
    })
    expect(result.swift.get('Home.swift')).toContain('MavisTimeEntry(')
    expect(result.swift.get('Home.swift')).toContain('minuteStep: 15')
    expect(result.swift.get('Home.swift')).toContain(
      'TimeValidation(status: value.status, value: value.value)',
    )
  })
  it.each([0, 7, 60])('rejects a minute step of %s', async (step) => {
    await expect(
      compile({ 'Home.lite.tsx': tsx(`<MTimePicker label="Meeting" minuteStep={${step}}/>`) }),
    ).rejects.toThrow('minuteStep must be a divisor')
  })
})

describe('Mac scheduler', () => {
  it('uses the existing scheduler contract and preserves application event metadata', async () => {
    expect(
      Object.keys(components.MScheduler.props).filter(
        (prop) =>
          !['value', 'onValueChange', 'onDateChange', 'onChange', 'onError', 'onSelect'].includes(
            prop,
          ) && !(prop in schedulerProps),
      ),
    ).toEqual([])
    const result = await compileProject(await readShared(join(root, 'schedule')), {
      root: 'Planner',
    })
    const code = result.swift.get('Planner.swift')
    expect(code).toContain(
      'setTime: { event, change in var next = event; next.start = change.start; next.end = change.end; return next }',
    )
    expect(code).toContain('self.events = value')
    expect(code).toContain('self.date = value')
    expect(code).toContain(
      'SchedulerChange(id: value.id, start: value.start, end: value.end, kind: value.kind)',
    )
    const runtime = [...result.swift.values()].join('\n')
    expect(runtime).toContain('JoltDragModel')
    expect(runtime).toContain('.joltLayout(value: segment')
    expect(runtime).toContain('onChange(of: sync)')
    expect(runtime).toContain('This local time does not exist')
  })
  it.each([
    ['days={2}', 'not assignable'],
    ['slotMinutes={7}', 'slotMinutes must be'],
    ['hourHeight={40}', 'hourHeight must be'],
    ['dayWidth={600}', 'dayWidth must be'],
  ])('rejects invalid scheduler geometry %s', async (prop, message) => {
    await expect(
      compile({
        'Home.lite.tsx': tsx(
          `<MScheduler label="Plan" value={state.items} date="2026-03-08" timeZone="America/New_York" ${prop}/>`,
          'items: [] as SchedulerEvent[]',
        ),
      }),
    ).rejects.toThrow(message)
  })
})
