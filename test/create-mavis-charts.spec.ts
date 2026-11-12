import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chartGeometry } from '../packages/core/src/chart'
import {
  donutGeometry,
  sparklineGeometry,
  type DonutSegment,
  type SparklinePoint,
} from '../packages/core/src/dashboard'
import { gaugeGeometry } from '../packages/core/src/creative-controls'
import { gaugeProps } from '../packages/core/src/vue/creative-props'
import { donutChartProps, sparklineProps } from '../packages/core/src/vue/dashboard-props'
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
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({\n    points: [] as SparklinePoint[],\n    parts: [] as DonutSegment[],\n    picked: null as string | null,\n    names: ['a'],\n    low: 0,\n    tint: '#336699',\n${members}  })\n  return (\n${view}\n  )\n}\n`
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
