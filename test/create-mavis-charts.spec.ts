import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  chartGeometry,
  chartHitTest,
  interpolateChart,
  type ChartCategory,
  type ChartSeries,
} from '../packages/core/src/chart'
import {
  donutGeometry,
  sparklineGeometry,
  type DonutSegment,
  type SparklinePoint,
} from '../packages/core/src/dashboard'
import { gaugeGeometry } from '../packages/core/src/creative-controls'
import {
  heatmapCalendar,
  heatmapColor,
  type HeatmapValue,
} from '../packages/core/src/advanced-collections'
import { heatmapProps } from '../packages/core/src/vue/advanced-props'
import type { CivilDate } from '../packages/core/src/date'
import { gaugeProps } from '../packages/core/src/vue/creative-props'
import { donutChartProps, sparklineProps } from '../packages/core/src/vue/dashboard-props'
import { chartProps } from '../packages/core/src/vue/wayfinding-props'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { chartGeometry as chartPorts } from '../packages/create-mavis/templates/macos/scripts/portable/components/chart-kit.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { chartPlotGeometry as chartPlotPorts } from '../packages/create-mavis/templates/macos/scripts/portable/components/chart.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { heatmapGeometry as heatmapPorts } from '../packages/create-mavis/templates/macos/scripts/portable/components/heatmap.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { donutGeometry as donutPorts } from '../packages/create-mavis/templates/macos/scripts/portable/components/donut.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { gaugeGeometry as gaugePorts } from '../packages/create-mavis/templates/macos/scripts/portable/components/gauge.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { sparklineGeometry as sparklinePorts } from '../packages/create-mavis/templates/macos/scripts/portable/components/sparkline.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { runtime } from '../packages/create-mavis/templates/macos/scripts/portable/emit-swift.mjs'

const root = new URL('..', import.meta.url).pathname
const portable = new URL('./portable/', import.meta.url).pathname

type Output = {
  model: { components: { name: string; view: unknown }[]; records: unknown[] }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>): Promise<Output> =>
  compileProject(shared(files), { root: 'Home' })
const tsx = (view: string, members = '') =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({\n    points: [] as SparklinePoint[],\n    parts: [] as DonutSegment[],\n    picked: null as string | null,\n    days: [] as ChartCategory[],\n    week: [] as ChartSeries[],\n    mark: null as ChartSelection | null,\n    names: ['a'],\n    low: 0,\n    tint: '#336699',\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nimport type { SparklinePoint } from '#mavis'\nconst points = ref<SparklinePoint[]>([])\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])
const fixture = async (name: string, component: string): Promise<Output> =>
  compileProject(await readShared(join(portable, name)), { root: component })
const problems = async (files: Record<string, string>) => {
  try {
    await compile(files)
  } catch (error) {
    return (error as { diagnostics: { message: string }[] }).diagnostics
      .map((item) => item.message)
      .join('\n')
  }
  return ''
}

// The Swift ports of the core's geometry, compiled on their own and run on a Mac: what each one
// answers is compared with the core function, value for value. A build is kept by its sources.
const swiftc = process.platform === 'darwin' && spawnSync('swiftc', ['--version']).status === 0
const number = (value: number | null) =>
  value === null
    ? 'nil'
    : Number.isNaN(value)
      ? 'Double.nan'
      : !Number.isFinite(value)
        ? `${value < 0 ? '-' : ''}Double.infinity`
        : Object.is(value, -0)
          ? '-0.0'
          : /[.e]/.test(String(value))
            ? String(value)
            : `${value}.0`
const list = (values: readonly (number | null)[] | undefined) =>
  values ? `[${values.map(number).join(', ')}]` : 'nil'
const text = (value: string) => JSON.stringify(value)
function ports(source: string, calls: string[]): unknown[] {
  const files = {
    'Runtime.swift': runtime,
    'Ports.swift': `import Foundation\nimport CoreGraphics\n\n${source}\n`,
    'main.swift': `import Foundation

func show(_ value: Any) {
    let data = try! JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed, .sortedKeys])
    print(String(data: data, encoding: .utf8)!)
}

${calls.map((call) => `show(${call})`).join('\n')}
`,
  }
  const hash = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 20)
  const folder = join(root, 'artifacts/portable/ports', hash)
  if (!existsSync(join(folder, 'ports'))) {
    mkdirSync(folder, { recursive: true })
    for (const [name, content] of Object.entries(files)) writeFileSync(join(folder, name), content)
    execFileSync('swiftc', ['-o', 'ports', ...Object.keys(files)], { cwd: folder, stdio: 'pipe' })
  }
  return execFileSync(join(folder, 'ports'), { encoding: 'utf8' })
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
}
const attempt = <T>(run: () => T) => {
  try {
    return run()
  } catch {
    return null
  }
}

describe('the charts in both formats', () => {
  it.each([
    ['sparkline', 'Trend'],
    ['donut', 'Budget'],
    ['gauge', 'Meter'],
    ['chart', 'Activity'],
    ['heatmap', 'Practice'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, component) => {
    const fromTsx = await fixture(name, component)
    const fromVue = await fixture(`${name}Vue`, component)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${component}.vue`])
  })

  it('takes only properties of the published contracts', () => {
    const contracts = {
      MSparkline: [sparklineProps, []],
      MDonutChart: [donutChartProps, ['value', 'onChange']],
      MGauge: [gaugeProps, []],
      MChart: [chartProps, ['value', 'onChange', 'onHiddenSeriesChange']],
      MHeatmap: [heatmapProps, ['value', 'onChange']],
    } as const
    for (const [name, [contract, own]] of Object.entries(contracts)) {
      const accepted = Object.keys(components[name].props).filter(
        (prop) => !(own as readonly string[]).includes(prop),
      )
      expect(
        accepted.filter((prop) => !Object.keys(contract).includes(prop)),
        name,
      ).toEqual([])
    }
  })
})

describe('the value axis every chart shares', () => {
  it.runIf(swiftc)(
    'ports chartGeometry: the domain, where zero sits and the ticks',
    () => {
      const cases: [(number | null)[], [number, number]?][] = [
        [[12, 18, null, 9, 24]],
        [[-4, 2.5, 0.1]],
        [[]],
        [[null, null]],
        [[0, 0, 0]],
        [[7]],
        [[-3, -3]],
        [[1e-7, 3e-7]],
        [
          [12, 18],
          [0, 100],
        ],
        [
          [12, 18],
          [10, 20],
        ],
        [
          [-5, 5],
          [-10, 10],
        ],
        [[5], [10, 20]],
        [[5], [20, 10]],
        [[5], [0, Infinity]],
        [[Infinity]],
        [[NaN, 1]],
        [[1e308, -1e308]],
      ]
      const answers = ports(
        `${chartPorts}\n\nfunc scale(_ values: [Double?], _ domain: [Double]?) -> Any {\n    guard let scale = mavisChartScale(values, domain: domain) else { return NSNull() }\n    return ["min": scale.min, "max": scale.max, "zero": scale.zero, "ticks": scale.ticks, "y": values.map { $0.map { scale.y($0) as Any } ?? NSNull() }] as [String: Any]\n}`,
        cases.map(([values, domain]) => `scale(${list(values)}, ${list(domain)})`),
      )
      cases.forEach(([values, domain], index) => {
        const expected = attempt(() => {
          const geometry = chartGeometry(
            values.map((_, key) => ({ key, label: 'x' })),
            [{ key: 'series', label: 'Series', values }],
            domain,
          )
          return {
            min: geometry.min,
            max: geometry.max,
            zero: geometry.zero,
            ticks: geometry.ticks,
            y: geometry.series[0]!.points.map((point) => point?.y ?? null),
          }
        })
        expect(answers[index], `case ${index}`).toEqual(expected)
      })
    },
    120_000,
  )
})

describe('MSparkline', () => {
  it('passes its data, domain and formatter to MavisSparkline and to the Web component', async () => {
    const { swift, vue: web, native } = await fixture('sparkline', 'Trend')
    const view = swift.get('Trend.swift')!
    expect(view).toMatch(
      /MavisSparkline\(\n +label: "Level",\n +points: self\.flat\.map \{ MavisChartPoint\(id: \$0\.id, label: \$0\.label, value: \$0\.value\) \},\n +domain: \[0\.0, 10\.0\],\n +height: 100\.0,\n +color: mavisHexColor\("#2F7D6B"\),\n +dataLabel: "Level data"\n +\)/,
    )
    expect(view).toContain(
      'format: { (value: Double) -> String in "\\(mavisString(value)) ms" }\n            )\n                .mavisIdentifier("replies")',
    )
    expect(view).toContain('showData: true,\n                dataLabel: "Quiet data",')
    expect(swift.get('MavisTypes.swift')).toContain(
      'struct SparklinePoint: Hashable {\n    var id: String\n    var label: String\n    var value: Double?\n}',
    )
    // A missing value is null for Mavis on the Web and NativeScript, undefined in the model.
    for (const output of [web, native]) {
      const file = output.get('Trend.vue')!
      expect(file).toContain("{ id: 'wed', label: 'Wed', value: undefined }")
      expect(file).toContain(
        '<MSparkline id="replies" label="Replies" :points="state.replies.map((entry) => ({ ...entry, value: entry.value ?? null }))" :formatValue="(value) => `${value} ms`" />',
      )
      expect(file).toContain(':domain="[0, 10]" :height="100" :animated="false"')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSparkline: View {')
    // Jolt runs the motion: the theme's data timing, and Reduce Motion through joltLayout.
    expect(controls).toContain(
      'let mavisDataMotion = try! JoltTransition.tween(milliseconds: 432, ease: .easeOut)',
    )
    expect(controls).toMatch(/\.joltLayout\(value: animated \? MavisSparkMotion\(/)
  })

  it('passes a list without gaps as it is', async () => {
    const { vue: web, swift } = await compile({
      'types.ts':
        'export type Reading = { id: string; label: string; value: number; note: string }\n',
      'Home.lite.tsx': `import { useStore } from '@builder.io/mitosis'\nimport type { Reading } from './types'\n\nexport default function Home() {\n  const state = useStore({ readings: [] as Reading[], top: 40 })\n  return <MSparkline label="Load" points={state.readings} domain={[0, state.top]} color={state.top > 10 ? '#AA0000' : '#00AA00'} />\n}\n`,
    })
    expect(web.get('Home.vue')).toContain(
      `<MSparkline label="Load" :points="state.readings" :domain="[0, state.top]" :color="((state.top > 10) ? '#AA0000' : '#00AA00')" />`,
    )
    expect(swift.get('Home.swift')).toContain(
      'points: self.readings.map { MavisChartPoint(id: $0.id, label: $0.label, value: $0.value) },\n            domain: [0.0, self.top],\n            color: mavisHexColor(((self.top > 10.0) ? "#AA0000" : "#00AA00"))',
    )
  })

  it.runIf(swiftc)(
    'ports sparklineGeometry: every run, gap and lone value where the core puts it',
    () => {
      const point = (value: number | null, index: number): SparklinePoint => ({
        id: `p${index}`,
        label: `Point ${index}`,
        value,
      })
      const series = (values: (number | null)[]) => values.map(point)
      const cases: [SparklinePoint[], [number, number] | undefined, number, number][] = [
        [series([12, 18, null, 9, 24]), undefined, 300, 64],
        [series([12, 18, null, 9, 24]), [0, 30], 300, 64],
        [series([3]), undefined, 100, 40],
        [series([null, 3]), undefined, 100, 40],
        [series([3, null]), undefined, 123.5, 24],
        [series([null, 5, null, 5, null]), [0, 10], 640, 240],
        [series([-4, 2.5, 0.1, -0.25]), undefined, 417.25, 96],
        [series([0, 0]), [0, 10], 752, 100],
        [series([]), undefined, 100, 40],
        [series([null, null]), undefined, 100, 40],
        [
          series(Array.from({ length: 100 }, (_, index) => Math.sin(index) * 50)),
          undefined,
          800,
          64,
        ],
        [series(Array.from({ length: 101 }, () => 1)), undefined, 800, 64],
        [[point(1, 0), point(2, 0)], undefined, 100, 40],
        [[{ id: '', label: 'A', value: 1 }], undefined, 100, 40],
        [[{ id: 'a', label: '  ', value: 1 }], undefined, 100, 40],
        [series([1, Infinity]), undefined, 100, 40],
        [series([1, 20]), [0, 10], 100, 40],
        [series([1, 2]), [10, 0], 100, 40],
      ]
      const answers = ports(
        `${chartPorts}\n\n${sparklinePorts}\n\nfunc spark(_ points: [MavisChartPoint], _ domain: [Double]?, _ width: Double, _ height: Double) -> Any {\n    guard let paths = mavisSparklinePaths(points, domain: domain, width: width, height: height) else { return NSNull() }\n    return paths.map { ["id": $0.id, "points": $0.points.map { [Double($0.x), Double($0.y)] }] as [String: Any] }\n}`,
        cases.map(
          ([points, domain, width, height]) =>
            `spark([${points.map((item) => `MavisChartPoint(id: ${text(item.id)}, label: ${text(item.label)}, value: ${number(item.value)})`).join(', ')}], ${list(domain)}, ${number(width)}, ${number(height)})`,
        ),
      )
      cases.forEach(([points, domain, width, height], index) => {
        const expected = attempt(() =>
          sparklineGeometry(points, domain, width, height).paths.map((path) => ({
            id: path.id,
            points: path.d
              .slice(1)
              .split(' L')
              .map((pair) => pair.split(' ').map(Number)),
          })),
        )
        expect(answers[index], `case ${index}`).toEqual(expected)
      })
    },
    120_000,
  )

  it.each([
    [
      '<MSparkline label="x" points={state.names} />',
      /not assignable|MSparkline takes a list of records/,
    ],
    ['<MSparkline label="x" points={state.points} height={12} />', /height is from 24 to 240/],
    [
      '<MSparkline label="x" points={state.points} domain={[10, 0]} />',
      /domain needs two increasing values/,
    ],
    [
      '<MSparkline label="x" points={state.points} color="tomato" />',
      /color takes a hex color every target reads/,
    ],
    ['<MSparkline points={state.points} />', /is missing|MSparkline needs label/],
    [
      '<MSparkline label="x" points={state.points} formatValue={(value) => value * 2} />',
      /not assignable|Expected string/,
    ],
    [
      '<MSparkline label="x" points={state.points} formatValue={() => "x"} />',
      /formatValue is written in place, as an arrow from the value to its text/,
    ],
    [
      '<MSparkline label="x" points={state.points} onClick={() => (state.low += 1)} />',
      /does not exist|MSparkline supports id, label, points/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  it('names a formatter that is a function of the component, and a domain kept elsewhere', async () => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          '    <MSparkline label="x" points={state.points} formatValue={state.unit} />',
          '    unit(value: number) {\n      state.low = value\n    },\n',
        ),
      }),
    ).toMatch(/not assignable|formatValue is written in place/)
    expect(
      await problems({
        'Home.vue': vue(
          'const wide = ref(false)',
          '  <MSparkline label="x" :points="points" :domain="wide ? [0, 100] : [0, 10]" />',
        ),
      }),
    ).toMatch(/domain is written in place as \[lowest, highest\], such as \[0, 100\]/)
    expect(
      await problems({
        'Home.vue': vue(
          'function unit(value: number) {\n  return `${value} ms`\n}',
          '  <MSparkline label="x" :points="points" :format-value="unit" />',
        ),
      }),
    ).toMatch(/unit returns a value/)
  })
})

describe('MDonutChart', () => {
  it('passes the segments and the selection to MavisDonutChart and to the Web component', async () => {
    const { swift, vue: web, native } = await fixture('donut', 'Budget')
    const view = swift.get('Budget.swift')!
    expect(view).toContain(
      [
        'MavisDonutChart(',
        '    label: "Budget",',
        '    segments: self.parts.map { MavisDonutSegment(id: $0.id, label: $0.label, value: $0.value, color: $0.color) },',
        '    value: self.picked,',
        '    onChange: { (value: String?) in',
        '        self.picked = value',
        '    },',
        '    animateNumber: true,',
        '    disabled: self.locked,',
        '    totalLabel: "All",',
        '    format: { (value: Double) -> String in "$\\(mavisString(value))" }',
        ')',
        '    .mavisIdentifier("budget")',
      ]
        .map((line) => `            ${line}`)
        .join('\n'),
    )
    expect(view).toContain('@State private var picked: String?')
    expect(swift.get('MavisTypes.swift')).toContain(
      'struct DonutSegment: Hashable {\n    var id: String\n    var label: String\n    var value: Double\n    var color: String?\n}',
    )
    // Mavis reports no selection as null; the model keeps a missing value.
    for (const output of [web, native])
      expect(output.get('Budget.vue')).toContain(
        '<MDonutChart id="budget" label="Budget" :segments="state.parts" :modelValue="state.picked ?? null" @update:modelValue="(next) => ((value) => state.picked = value)(next ?? undefined)" :disabled="state.locked" :animateNumber="true" totalLabel="All" :formatValue="(value) => `$${value}`" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisDonutChart: View {')
    // The ring is the outline the core strokes, swept by Jolt; the number rolls through Jolt.
    expect(controls).toContain(
      '.joltLayout(value: animated ? [from, to, drawn ? 1 : 0] : [], transition: mavisDataMotion)',
    )
    expect(controls).toContain('JoltRollingText(roll.number, alignment: .center)')
  })

  it.runIf(swiftc)(
    'ports donutGeometry: the total and each share of the ring',
    () => {
      const segment = (value: number, index: number, color?: string): DonutSegment => ({
        id: `s${index}`,
        label: `Segment ${index}`,
        value,
        ...(color === undefined ? {} : { color }),
      })
      const each = (values: number[]) => values.map((value, index) => segment(value, index))
      const cases: DonutSegment[][] = [
        each([30, 20, 10]),
        each([1, 2, 3, 4, 5, 6, 7]),
        each([0.1, 0.2, 0.3]),
        each([0, 0]),
        each([5]),
        [],
        each([0, 3, 0, 1e-9]),
        each(Array.from({ length: 24 }, (_, index) => index + 0.5)),
        each(Array.from({ length: 25 }, () => 1)),
        [segment(1, 0, '#2F7D6B'), segment(2, 1, '#abcdef')],
        [segment(1, 0, '')],
        [segment(1, 0, 'tomato')],
        [segment(1, 0, '#12345')],
        [segment(1, 0, '#12345G')],
        each([-1]),
        each([Infinity]),
        each([NaN]),
        each([1e308, 1e308]),
        [segment(1, 0), segment(2, 0)],
        [{ id: '', label: 'A', value: 1 }],
        [{ id: 'a', label: ' \n', value: 1 }],
      ]
      const answers = ports(
        `${chartPorts}\n\n${donutPorts}\n\nfunc donut(_ segments: [MavisDonutSegment]) -> Any {\n    guard let geometry = mavisDonutGeometry(segments) else { return NSNull() }\n    return ["total": geometry.total, "slices": geometry.slices.map { ["id": $0.segment.id, "index": $0.index, "ratio": $0.ratio, "start": $0.start, "end": $0.end] as [String: Any] }] as [String: Any]\n}`,
        cases.map(
          (segments) =>
            `donut([${segments.map((item) => `MavisDonutSegment(id: ${text(item.id)}, label: ${text(item.label)}, value: ${number(item.value)}, color: ${item.color === undefined ? 'nil' : text(item.color)})`).join(', ')}])`,
        ),
      )
      cases.forEach((segments, index) => {
        const expected = attempt(() => {
          const geometry = donutGeometry(segments)
          return {
            total: geometry.total,
            slices: geometry.segments.map((slice, place) => ({
              id: slice.id,
              index: place,
              ratio: slice.ratio,
              start: slice.start,
              end: slice.end,
            })),
          }
        })
        expect(answers[index], `case ${index}`).toEqual(expected)
      })
    },
    120_000,
  )

  it.each([
    [
      '<MDonutChart label="x" segments={state.points} />',
      /not assignable|Every segment of MDonutChart has a value/,
    ],
    ['<MDonutChart label="x" segments={state.parts} size={40} />', /size is from 100 to 800/],
    [
      '<MDonutChart label="x" segments={state.parts} strokeWidth={24} />',
      /strokeWidth is from 1 to 20/,
    ],
    [
      '<MDonutChart label="x" segments={state.parts} value={state.low} />',
      /not assignable|Expected string/,
    ],
    [
      '<MDonutChart label="x" segments={state.parts} modelValue={state.picked} />',
      /does not exist|MDonutChart supports id, label, segments, value, onChange/,
    ],
    [
      '<MDonutChart label="x" segments={state.parts} onChange={(id, more) => (state.picked = id)} />',
      /not assignable|This handler receives 1 argument/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  it('listens to the selection from a Vue file, with the value and the event apart', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        "import type { DonutSegment } from '#mavis'\nconst parts = ref<DonutSegment[]>([])\nconst picked = ref<string | null>(null)\nconst changes = ref(0)",
        '  <MDonutChart label="x" :segments="parts" :model-value="picked" @update:model-value="(id) => { picked = id; changes += 1 }" />',
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'value: self.picked,\n            onChange: { (id: String?) in\n                self.picked = id\n                self.changes += 1.0\n            }',
    )
  })
})

describe('MGauge', () => {
  it('passes the value, its range and the formatter to MavisGauge and to the Web component', async () => {
    const { swift, vue: web, native } = await fixture('gauge', 'Meter')
    const view = swift.get('Meter.swift')!
    expect(view).toContain(
      [
        'MavisGauge(',
        '    label: "Shifted",',
        '    value: self.load,',
        '    minimum: 50.0,',
        '    maximum: 150.0,',
        '    size: 200.0,',
        '    strokeWidth: 18.0,',
        '    animated: false,',
        '    color: mavisHexColor("#2F7D6B"),',
        '    format: { (value: Double) -> String in "\\(mavisString(value)) rpm" }',
        ')',
      ]
        .map((line) => `                        ${line}`)
        .join('\n'),
    )
    expect(view).toContain(
      'MavisGauge(\n                        label: "Half",\n                        value: self.load,\n                        size: 120.0,\n                        semi: true\n                    )\n                        .mavisIdentifier("half")',
    )
    for (const output of [web, native]) {
      const file = output.get('Meter.vue')!
      expect(file).toContain(
        '<MGauge label="Shifted" :value="state.load" :min="50" :max="150" :size="200" :strokeWidth="18" color="#2F7D6B" :animated="false" :formatValue="(value) => `${value} rpm`" />',
      )
      expect(file).toContain(
        '<MGauge id="half" label="Half" :value="state.load" :size="120" :semi="true" />',
      )
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisGauge: View {')
    expect(controls).toContain('MavisPlotBox(side: Swift.max(80, size), ratio: semi ? 0.58 : 1)')
    expect(controls).toContain(
      '.joltLayout(value: animated ? ratio : 0, transition: mavisDataMotion)',
    )
    // One element for assistive technology, as the meter is on the Web.
    expect(controls).toMatch(
      /\.accessibilityElement\(children: \.ignore\)\n +\.accessibilityLabel\(Text\(verbatim: label\)\)\n +\.accessibilityValue\(/,
    )
  })

  it.runIf(swiftc)(
    'ports gaugeGeometry: the value inside its range and its share of the arc',
    () => {
      const cases: [number, number, number][] = [
        [75, 0, 100],
        [25, 50, 150],
        [140, 0, 100],
        [-20, 0, 100],
        [0.1, 0, 0.3],
        [-3, -10, -1],
        [5, 5, 6],
        [1e-12, 0, 1e-9],
        [7, 3, 3],
        [7, 10, 0],
        [NaN, 0, 100],
        [1, -Infinity, 100],
        [1, 0, Infinity],
      ]
      const answers = ports(
        `${gaugePorts}\n\nfunc gauge(_ value: Double, _ min: Double, _ max: Double) -> Any {\n    guard let geometry = mavisGaugeGeometry(value, min: min, max: max) else { return NSNull() }\n    return ["value": geometry.value, "ratio": geometry.ratio] as [String: Any]\n}`,
        cases.map(([value, min, max]) => `gauge(${number(value)}, ${number(min)}, ${number(max)})`),
      )
      cases.forEach(([value, min, max], index) => {
        const expected = attempt(() => {
          const geometry = gaugeGeometry(value, min, max, false)
          return { value: geometry.value, ratio: geometry.ratio }
        })
        expect(answers[index], `case ${index}`).toEqual(expected)
      })
      // The outlines the Mac strokes are the two paths of the core, one unit short of a full turn.
      expect(gaugeGeometry(1, 0, 2, false).path).toBe('M 50 10 A 40 40 0 1 1 49.999 10')
      expect(gaugeGeometry(1, 0, 2, true).path).toBe('M 10 50 A 40 40 0 0 1 90 50')
      expect(gaugeGeometry(1, 0, 2, true).viewBox).toEqual([0, 0, 100, 58])
    },
    120_000,
  )

  it.each([
    ['<MGauge label="x" value={state.low} size={40} />', /size is 80 or more/],
    ['<MGauge label="x" value={state.low} strokeWidth={19} />', /strokeWidth is above 0, up to 18/],
    ['<MGauge label="x" value={state.low} min={10} max={10} />', /max is above min/],
    ['<MGauge label="x" value={state.low} min={120} />', /max is above min/],
    ['<MGauge label="x" value={state.low} color="red" />', /color takes a hex color/],
    ['<MGauge label="x" value={state.tint} />', /not assignable|Expected number/],
    ['<MGauge value={state.low} />', /is missing|MGauge needs label/],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })
})

describe('MChart', () => {
  const swiftCategories = (items: readonly ChartCategory[]) =>
    `[${items.map((item) => `MavisChartCategory(key: ${text(String(item.key))}, label: ${text(item.label)})`).join(', ')}]`
  const swiftSeries = (items: readonly ChartSeries[]) =>
    `[${items.map((item) => `MavisChartSeries(key: ${text(String(item.key))}, label: ${text(item.label)}, values: ${list(item.values)}, color: ${item.color === undefined ? 'nil' : text(item.color)})`).join(', ')}]`
  const days = (count: number): ChartCategory[] =>
    Array.from({ length: count }, (_, index) => ({ key: `c${index}`, label: `Day ${index}` }))
  const series = (key: string, values: (number | null)[], color?: string): ChartSeries => ({
    key,
    label: `Series ${key}`,
    values,
    ...(color === undefined ? {} : { color }),
  })
  const helpers = `${chartPorts}\n\n${chartPlotPorts}

func chart(_ categories: [MavisChartCategory], _ series: [MavisChartSeries], _ domain: [Double]?) -> Any {
    guard let geometry = mavisChartGeometry(categories, series, domain: domain) else { return NSNull() }
    return [
        "min": geometry.scale.min, "max": geometry.scale.max, "zero": geometry.scale.zero, "ticks": geometry.scale.ticks,
        "series": geometry.series.map { line in
            ["key": line.key, "points": line.points.map { point -> Any in
                guard let point else { return NSNull() }
                return ["index": point.index, "value": point.value, "x": point.x, "y": point.y] as [String: Any]
            }] as [String: Any]
        },
    ] as [String: Any]
}

func hits(_ categories: [MavisChartCategory], _ series: [MavisChartSeries], _ bars: Bool, _ places: [[Double]]) -> Any {
    guard let geometry = mavisChartGeometry(categories, series, domain: nil) else { return NSNull() }
    return places.map { place -> Any in
        guard let hit = mavisChartHitTest(geometry, bars: bars, x: place[0], y: place[1]) else { return NSNull() }
        return ["category": hit.category, "series": hit.series] as [String: Any]
    }
}

func moved(_ categories: [MavisChartCategory], _ from: [MavisChartSeries], _ to: [MavisChartSeries], _ progress: Double) -> Any {
    guard let before = mavisChartGeometry(categories, from, domain: nil), let after = mavisChartGeometry(categories, to, domain: nil) else { return NSNull() }
    return after.series.map { line -> Any in
        let old = before.series.first { $0.key == line.key } ?? MavisChartLine(key: line.key, points: line.points.map { _ in nil })
        let start = mavisChartOffsets(old, zero: before.scale.zero)
        let end = mavisChartOffsets(line, zero: after.scale.zero)
        let now = zip(start, end).map { $0 + ($1 - $0) * progress }
        return line.points.enumerated().map { index, point -> Any in point == nil ? NSNull() : now[0] + now[index + 1] }
    }
}`

  it('keeps pointer exploration in paired source fixtures without adding a public prop', async () => {
    const tsx = await fixture('chartHover', 'Home')
    const vue = await fixture('chartHoverVue', 'Home')
    for (const output of [tsx, vue]) {
      expect(output.swift.get('Home.swift')).toContain('plotID: "hover-chart" + "-plot"')
      expect(output.swift.get('MavisControls.swift')).toContain('.onContinuousHover { phase in')
    }
    expect(components.MChart.props).not.toHaveProperty('hover')
    expect(components.MChart.props).not.toHaveProperty('preview')
  })
  it('passes the data, the selection and the hidden series to MavisChart and to the Web component', async () => {
    const { swift, vue: web, native } = await fixture('chart', 'Activity')
    const view = swift.get('Activity.swift')!
    expect(view).toContain(
      [
        'MavisChart(',
        '    label: "Activity",',
        '    description: "Four days",',
        '    categories: self.days.map { MavisChartCategory(key: $0.key, label: $0.label) },',
        '    series: self.week.map { MavisChartSeries(key: $0.key, label: $0.label, values: $0.values, color: $0.color) },',
        '    bars: (self.bars ? "bar" : "line") == "bar",',
        '    height: 200.0,',
        '    value: self.picked.map { MavisChartSelection(category: $0.category, series: $0.series) },',
        '    onChange: { mavisNext in',
        '        ({ (value: ChartSelection?) in',
        '            self.picked = value',
        '        })(mavisNext.map { ChartSelection(category: $0.category, series: $0.series) })',
        '    },',
        '    disabled: self.locked,',
        '    hiddenSeries: self.hidden,',
        '    onHiddenSeriesChange: { (value: [String]) in',
        '        self.hidden = value',
        '    },',
        '    format: { (value: Double) -> String in "\\(mavisString(value))k" },',
        '    missingLabel: "Nothing",',
        '    categoryLabel: "Day",',
        '    seriesLabel: "Metric",',
        '    plotID: "activity" + "-plot"',
        ')',
        '    .mavisIdentifier("activity")',
      ]
        .map((line) => `            ${line}`)
        .join('\n'),
    )
    expect(view).toContain('bars: true,\n                            domain: [0.0, 100.0]')
    expect(swift.get('MavisTypes.swift')).toContain(
      'struct ChartSeries: Hashable {\n    var key: String\n    var label: String\n    var values: [Double?]\n    var color: String?\n}',
    )
    // Mavis takes null for a gap and for no selection, and reports keys as text or numbers.
    for (const output of [web, native]) {
      const file = output.get('Activity.vue')!
      expect(file).toContain(
        ':series="state.week.map((entry) => ({ ...entry, values: entry.values.map((value) => value ?? null) }))"',
      )
      expect(file).toContain(
        ':modelValue="state.picked ?? null" @update:modelValue="(next) => ((value) => state.picked = value)(next ? { category: String(next.category), series: String(next.series) } : undefined)" :hiddenSeries="state.hidden" @update:hiddenSeries="(keys) => ((value) => state.hidden = value)(keys.map(String))"',
      )
      expect(file).toContain(`:type="(state.bars ? 'bar' : 'line')"`)
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisChart: View {')
    // Jolt brings the plot in and moves its marks; a click on the plot goes through the hit test.
    expect(controls).toContain(
      '.joltMotion(to: entered ? .identity : Self.entry, transition: enter)',
    )
    expect(controls).toMatch(
      /private var enter: JoltTransition \{ try! JoltTransition\.tween\(milliseconds: \d+, ease: \.\w+\) \}/,
    )
    expect(controls).toContain('private static let entry = try! JoltPose(y: 6, opacity: 0.35)')
    expect(controls).toMatch(/\.joltLayout\(value: \[geometry\.scale\.zero\] \+ zip\(/)
    expect(controls).toContain(
      'if let hit = mavisChartHitTest(visible, bars: bars, x: x, y: y) { pick(hit.category, hit.series) }',
    )
    expect(controls).toContain('.onContinuousHover { phase in')
    expect(controls).toContain('preview(mavisChartHitTest(visible, bars: bars, x: x, y: y))')
    expect(controls).toContain('case .ended: preview(nil)')
    expect(controls).toContain(
      'private var presented: (category: Int, series: Int)? { locate(hovered) ?? selected }',
    )
    expect(controls).toContain('bars: bars, selected: presented, pick: choose, preview: preview')
    const preview = controls.slice(
      controls.indexOf('private func preview(_ hit:'),
      controls.indexOf('private func choose(_ category:'),
    )
    expect(preview).not.toContain('onChange(')
    expect(preview).toContain('guard !disabled')
    expect(controls).toContain('JoltPresence(dataOpen) {')
  })

  it.runIf(swiftc)(
    'ports chartGeometry: every mark of every series where the core puts it',
    () => {
      const cases: [ChartCategory[], ChartSeries[], [number, number]?][] = [
        [days(4), [series('a', [20, 40, 30, 10]), series('b', [10, null, 20, 5], '#2F7D6B')]],
        [days(3), [series('a', [-4, 2.5, 0.1]), series('b', [0, -0.25, 7])]],
        [days(2), [series('a', [12, 18])], [0, 100]],
        [days(1), [series('a', [100])], [0, 100]],
        [days(7), [series('a', [null, null, null, null, null, null, null])]],
        [days(0), [series('a', [])]],
        [days(3), []],
        [[{ key: '', label: 'Blank key' }], [series('a', [1])]],
        [
          days(100),
          [
            series(
              'a',
              Array.from({ length: 100 }, (_, index) => Math.cos(index) * 9),
            ),
          ],
        ],
        [
          days(101),
          [
            series(
              'a',
              Array.from({ length: 101 }, () => 1),
            ),
          ],
        ],
        [days(2), Array.from({ length: 8 }, (_, index) => series(`s${index}`, [index, -index]))],
        [days(2), Array.from({ length: 9 }, (_, index) => series(`s${index}`, [index, -index]))],
        [[...days(2), days(1)[0]!], [series('a', [1, 2, 3])]],
        [days(2), [series('a', [1, 2]), series('a', [3, 4])]],
        [days(2), [series('a', [1])]],
        [days(2), [{ key: 'a', label: ' ', values: [1, 2] }]],
        [[{ key: 'x', label: '' }], [series('a', [1])]],
        [days(2), [series('a', [1, 2], 'teal')]],
        [days(2), [series('a', [1, 2], '')]],
        [days(2), [series('a', [1, NaN])]],
        [days(2), [series('a', [1, 20])], [0, 10]],
      ]
      const answers = ports(
        helpers,
        cases.map(
          ([categories, lines, domain]) =>
            `chart(${swiftCategories(categories)}, ${swiftSeries(lines)}, ${list(domain)})`,
        ),
      )
      cases.forEach(([categories, lines, domain], index) => {
        const expected = attempt(() => {
          const geometry = chartGeometry(categories, lines, domain)
          return {
            min: geometry.min,
            max: geometry.max,
            zero: geometry.zero,
            ticks: geometry.ticks,
            series: geometry.series.map((line) => ({
              key: line.key,
              points: line.points.map(
                (point) =>
                  point && { index: point.index, value: point.value, x: point.x, y: point.y },
              ),
            })),
          }
        })
        expect(answers[index], `case ${index}`).toEqual(expected)
      })
    },
    120_000,
  )

  it.runIf(swiftc)(
    'ports chartHitTest, and moves marks as interpolateChart does',
    () => {
      const categories = days(4)
      const lines = [
        series('a', [20, 40, 30, 10]),
        series('b', [10, null, 20, 5]),
        series('c', [null, null, 35, 0]),
      ]
      const places = [-0.5, 0, 0.1, 0.24, 0.25, 0.3, 0.38, 0.49, 0.5, 0.62, 0.74, 0.9, 0.99, 1, 1.5]
        .flatMap((x) => [-1, 0, 0.2, 0.5, 0.75, 0.9, 2].map((y) => [x, y]))
        .concat([
          [NaN, 0.5],
          [0.5, Infinity],
        ])
      const next = [series('a', [5, 45, null, 30]), series('c', [15, 25, 35, 45])]
      const steps = [0, 0.25, 0.5, 0.9, 1]
      const [onLines, onBars, onNothing, ...moves] = ports(helpers, [
        `hits(${swiftCategories(categories)}, ${swiftSeries(lines)}, false, [${places.map((place) => list(place)).join(', ')}])`,
        `hits(${swiftCategories(categories)}, ${swiftSeries(lines)}, true, [${places.map((place) => list(place)).join(', ')}])`,
        `hits(${swiftCategories(days(0))}, ${swiftSeries([])}, false, [[0.5, 0.5]])`,
        ...steps.map(
          (progress) =>
            `moved(${swiftCategories(categories)}, ${swiftSeries(lines)}, ${swiftSeries(next)}, ${number(progress)})`,
        ),
      ])
      const geometry = chartGeometry(categories, lines)
      expect(onLines).toEqual(places.map(([x, y]) => chartHitTest(geometry, 'line', x!, y!)))
      expect(onBars).toEqual(places.map(([x, y]) => chartHitTest(geometry, 'bar', x!, y!)))
      expect(onNothing).toEqual([chartHitTest(chartGeometry([], []), 'line', 0.5, 0.5)])
      const after = chartGeometry(categories, next)
      steps.forEach((progress, index) => {
        const shown = interpolateChart(geometry, after, progress)
        const moved = moves[index] as (number | null)[][]
        shown.series.forEach((line, place) =>
          line.points.forEach((point, at) => {
            if (!point) expect(moved[place]![at]).toBeNull()
            else expect(moved[place]![at]).toBeCloseTo(point.y, 12)
          }),
        )
      })
    },
    120_000,
  )

  it.each([
    [
      '<MChart label=" " categories={state.days} series={state.week} />',
      /MChart requires a label that is not empty/,
    ],
    [
      '<MChart label="x" categories={state.days} series={state.week} type="pie" />',
      /not assignable|type is line or bar/,
    ],
    [
      '<MChart label="x" categories={state.days} series={state.week} height={80} />',
      /height is from 120 to 800/,
    ],
    [
      '<MChart label="x" categories={state.days} series={state.points} />',
      /not assignable|Every record of MChart needs key/,
    ],
    [
      '<MChart label="x" categories={[{ key: 1, label: \'One\' }]} series={state.week} />',
      /not assignable/,
    ],
    [
      '<MChart label="x" categories={state.days} series={state.week} value={state.picked} />',
      /not assignable|Expected ChartSelection/,
    ],
    [
      '<MChart label="x" categories={state.days} series={state.week} hiddenSeries={[1, 2]} />',
      /not assignable|Expected string/,
    ],
    [
      '<MChart label="x" categories={state.days} series={state.week} domain={[5, 5]} />',
      /domain needs two increasing values/,
    ],
    ['<MChart label="x" categories={state.days} />', /is missing|MChart needs series/],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  const script =
    "import type { ChartCategory, ChartSelection, ChartSeries } from '#mavis'\nconst days = ref<ChartCategory[]>([])\nconst week = ref<ChartSeries[]>([])\nconst mark = ref<ChartSelection | null>(null)\nconst hidden = ref<string[]>([])\nconst changes = ref(0)"

  it('takes v-model and v-model:hidden-series, and a listener beside the model', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        script,
        '  <MChart v-model="mark" v-model:hiddenSeries="hidden" label="x" :categories="days" :series="week" @update:model-value="changes += 1" />',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain(
      '({ (value: ChartSelection?) in\n                    self.mark = value\n                    self.changes += 1.0\n                })(mavisNext.map',
    )
    expect(view).toContain(
      'hiddenSeries: self.hidden,\n            onHiddenSeriesChange: { (value: [String]) in\n                self.hidden = value\n            }',
    )
  })

  it.each([
    [
      '  <MChart v-model:categories="days" label="x" :series="week" />',
      /MChart does not take v-model:categories on the Mac/,
    ],
    [
      '  <MChart v-model:hidden-series="hidden" v-model:hiddenSeries="hidden" label="x" :categories="days" :series="week" />',
      /v-model:hiddenSeries is set twice/,
    ],
    [
      '  <MChart v-model:hidden-series="hidden" :hidden-series="hidden" label="x" :categories="days" :series="week" />',
      /hiddenSeries is set twice/,
    ],
    [
      '  <MChart label="x" :categories="[{ key: 1, label: \'One\' }]" :series="week" />',
      /not assignable/,
    ],
  ])('rejects %s in a Vue file', async (template, message) => {
    expect(await problems({ 'Home.vue': vue(script, template) })).toMatch(message)
  })
})

describe('MHeatmap', () => {
  it('preserves date models, missing values, disabled dates and custom labels in all outputs', async () => {
    const { swift, vue: web, native } = await fixture('heatmap', 'Practice')
    const view = swift.get('Practice.swift')!
    expect(view).toContain('MavisHeatmap(')
    expect(view).toContain(
      'values: self.week.map { MavisHeatmapValue(date: $0.date, value: $0.value, label: $0.label, disabled: $0.disabled) }',
    )
    expect(view).toContain('weekStartsOn: 0.0,')
    expect(view).toContain('animated: false,')
    expect(view).toContain('disabled: self.locked,')
    expect(view).toContain('missingLabel: "None",')
    expect(view).toContain('format: { (value: Double) -> String in "\\(mavisString(value)) h" }')
    for (const output of [web, native]) {
      const source = output.get('Practice.vue')!
      expect(source).toContain(':modelValue="state.picked ?? null"')
      expect(source).toContain(
        ':values="state.week.map((entry) => ({ ...entry, value: entry.value ?? null }))"',
      )
      expect(source).toContain(
        ':weekStartsOn="0" :cellSize="32" :animated="false" :disabled="state.locked"',
      )
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      '.joltLayout(value: animated ? paint : "", transition: mavisDataMotion)',
    )
    expect(controls).toContain('if !disabled && !cell.disabled { onChange(cell.date) }')
  })

  it('types an explicit listener beside v-model as a CivilDate', async () => {
    const { swift } = await compile({
      'Home.vue': `<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate, HeatmapValue } from '#mavis'
const picked = ref<CivilDate | null>(null)
const last = ref<CivilDate | null>(null)
const days = ref<HeatmapValue[]>([])
</script>
<template>
<MHeatmap label="Dates" start="2026-09-01" end="2026-09-07" :values="days" v-model="picked" @update:model-value="(date) => last = date" />
</template>`,
    })
    expect(swift.get('Home.swift')).toContain('self.picked = date')
    expect(swift.get('Home.swift')).toContain('self.last = date')
  })

  it.runIf(swiftc)(
    'ports heatmapCalendar with Gregorian bounds, leap years, missing and duplicate days',
    () => {
      type Case = [CivilDate, CivilDate, HeatmapValue[], 0 | 1]
      const cases: Case[] = [
        ['2026-09-06', '2026-09-12', [], 0],
        [
          '2026-09-06',
          '2026-09-12',
          [
            { date: '2026-09-07', value: 0, label: 'Monday' },
            { date: '2026-09-09', value: 4, disabled: true },
            { date: '2026-09-10', value: null },
          ],
          1,
        ],
        ['2024-02-28', '2024-03-01', [{ date: '2024-02-29', value: 12 }], 1],
        ['1900-02-28', '1900-03-01', [], 1],
        ['2000-02-28', '2000-03-01', [], 0],
        ['0001-01-01', '0001-01-07', [], 1],
        ['9999-12-30', '9999-12-31', [], 1],
        ['2024-01-01', '2024-12-31', [], 1],
        ['2024-01-01', '2025-01-01', [], 1],
        ['2026-09-07', '2026-09-06', [], 1],
        ['2026-02-29', '2026-03-01', [], 1],
        ['0000-01-01', '0001-01-01', [], 1],
        [
          '2026-09-06',
          '2026-09-06',
          [
            { date: '2026-09-06', value: 1 },
            { date: '2026-09-06', value: 2 },
          ],
          1,
        ],
        ['2026-09-06', '2026-09-06', [{ date: '2026-09-07', value: -1 }], 1],
        ['2026-09-06', '2026-09-06', [{ date: '2026-09-06', value: Infinity }], 1],
        ['2026-09-06', '2026-09-06', [{ date: '2026-09-06', value: NaN }], 1],
        ['2026-09-06', '2026-09-06', [{ date: '2026-09-31', value: 1 }], 1],
        [
          '2026-09-06',
          '2026-09-06',
          [
            { date: '2026-09-07', value: 100 },
            { date: '2026-09-06', value: 1 },
          ],
          1,
        ],
      ]
      const answers = ports(
        `${chartPorts}\n${heatmapPorts}\n
func calendar(_ start: String, _ end: String, _ values: [MavisHeatmapValue], _ week: Double) -> Any {
  guard let geometry = mavisHeatmapCalendar(start: start, end: end, values: values, weekStartsOn: week) else { return NSNull() }
  return ["columns": geometry.columns, "max": geometry.max, "cells": geometry.cells.map {
    ["date": $0.date, "value": $0.value.map { $0 as Any } ?? NSNull(), "label": $0.label.map { $0 as Any } ?? NSNull(), "disabled": $0.disabled, "missing": $0.value == nil, "index": $0.index, "row": $0.row, "column": $0.column] as [String: Any]
  }] as [String: Any]
}`,
        cases.map(
          ([start, end, values, week]) =>
            `calendar(${text(start)}, ${text(end)}, [${values.map((item) => `MavisHeatmapValue(date: ${text(item.date)}, value: ${number(item.value)}, label: ${item.label === undefined ? 'nil' : text(item.label)}, disabled: ${item.disabled === undefined ? 'nil' : String(item.disabled)})`).join(', ')}], ${week})`,
        ),
      )
      cases.forEach(([start, end, values, week], index) => {
        const expected = attempt(() => {
          const result = heatmapCalendar(start, end, values, week)
          return {
            ...result,
            cells: result.cells.map((cell) => ({
              ...cell,
              label: cell.label ?? null,
              disabled: cell.disabled ?? false,
            })),
          }
        })
        expect(answers[index], `calendar case ${index}`).toEqual(expected)
      })
    },
    120_000,
  )

  it.runIf(swiftc)(
    'ports heatmapColor for scale boundaries, zero, missing values and invalid palettes',
    () => {
      const scale = ['#FFFFFF', '#88C0A8', '#2F7D6B']
      const cases: [number | null, number, string[]][] = [
        [null, 10, scale],
        [0, 10, scale],
        [4.99, 10, scale],
        [5, 10, scale],
        [9.99, 10, scale],
        [10, 10, scale],
        [20, 10, scale],
        [0, 0, scale],
        [1, 1, ['#abcdef', '#123456']],
        [1, 1, []],
        [null, 1, ['#FFFFFF']],
        [1, 1, ['#fff', '#000000']],
        [1, 1, Array(9).fill('#FFFFFF')],
      ]
      const answers = ports(
        `${chartPorts}\n${heatmapPorts}`,
        cases.map(
          ([value, max, colors]) =>
            `(mavisHeatmapColor(${number(value)}, max: ${number(max)}, colors: [${colors.map(text).join(', ')}]).map { $0 as Any } ?? NSNull())`,
        ),
      )
      cases.forEach(([value, max, colors], index) =>
        expect(answers[index]).toEqual(attempt(() => heatmapColor(value, max, colors))),
      )
    },
    120_000,
  )

  it.each([
    ['start="2026-02-29" end="2026-03-01"', /start is a date as YYYY-MM-DD/],
    ['start="0000-01-01" end="2026-03-01"', /start is a date as YYYY-MM-DD/],
    ['start="2026-03-01" end="2026-13-01"', /end is a date as YYYY-MM-DD/],
    ['start="2026-03-02" end="2026-03-01"', /range must contain 1–366 days/],
    ['start="2024-01-01" end="2025-01-01"', /range must contain 1–366 days/],
    ['start="2026-03-01" end="2026-03-07" cellSize={27}', /cellSize is from 28 to 80/],
    ['start="2026-03-01" end="2026-03-07" colors={["#FFFFFF"]}', /colors is a scale of 2 to 8/],
    [
      'start="2026-03-01" end="2026-03-07" colors={["red", "#FFFFFF"]}',
      /colors takes six-digit hex colors/,
    ],
    [
      'start="2026-03-01" end="2026-03-07" weekStartsOn={2}',
      /not assignable|weekStartsOn is 0 for Sunday or 1 for Monday/,
    ],
  ])('rejects invalid literal properties: %s', async (props, message) => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          `<MHeatmap label="Dates" values={state.calendar} ${props} />`,
          'calendar: [] as HeatmapValue[],',
        ),
      }),
    ).toMatch(message)
  })
})

describe('typed listeners beside chart models', () => {
  const modelScript = `import type { ChartCategory, ChartSelection, ChartSeries, DonutSegment } from '#mavis'
const days = ref<ChartCategory[]>([])
const week = ref<ChartSeries[]>([])
const mark = ref<ChartSelection | null>(null)
const last = ref<ChartSelection | null>(null)
const hidden = ref<string[]>([])
const lastHidden = ref<string[]>([])
const parts = ref<DonutSegment[]>([])
const picked = ref<string | null>(null)
const required = ref('')`

  it('keeps selection records and hidden-key arrays in listeners beside both chart models', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        modelScript,
        '<MChart v-model="mark" v-model:hidden-series="hidden" label="x" :categories="days" :series="week" @update:model-value="(value) => last = value" @update:hidden-series="(keys) => lastHidden = keys" />',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('self.mark = value')
    expect(view).toContain('self.last = value')
    expect(view).toContain('self.hidden = keys')
    expect(view).toContain('self.lastHidden = keys')
    expect(view).toContain('(keys: [String])')
  })

  it('does not pretend a cleared donut selection is a required string', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          modelScript,
          '<MDonutChart v-model="picked" label="x" :segments="parts" @update:model-value="(value) => required = value" />',
        ),
      }),
    ).toMatch(/not assignable/)
    const { swift } = await compile({
      'Home.vue': vue(
        modelScript,
        '<MDonutChart v-model="picked" label="x" :segments="parts" @update:model-value="(value) => required = value ?? \'none\'" />',
      ),
    })
    expect(swift.get('Home.swift')).toContain('self.picked = value')
    expect(swift.get('Home.swift')).toContain('self.required = (value ?? "none")')
  })
})
