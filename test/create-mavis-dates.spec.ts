import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
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
