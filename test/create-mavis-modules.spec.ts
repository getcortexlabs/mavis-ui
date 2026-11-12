import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { mavis } from '../packages/core/src/theme/themes'
import {
  checkShared,
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname

type Member = { name: string; exported: boolean }
type Output = {
  model: {
    components: { name: string; props: unknown[] }[]
    modules: { name: string; constants: Member[]; functions: Member[] }[]
    records: unknown[]
  }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>, options = {}): Promise<Output> =>
  compileProject(shared(files), { root: 'Home', ...options })
const home = (expression: string, imports = '') =>
  `${imports}\nexport default function Home() {\n  return <MText>{${expression}}</MText>\n}\n`
const screen = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { MText } from '#mavis'\n${script}\n</script>\n\n<template>\n  <MText>${template}</MText>\n</template>\n`
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])
const fixture = async (name: string, root: string): Promise<Output> =>
  compileProject(await readShared(join(portable, name)), { root })
const problems = async (files: Record<string, string>) => {
  try {
    await compile(files)
  } catch (error) {
    return (error as Error).message
  }
  return ''
}
/** What a module's function is in Swift, called from a screen. */
const swiftFor = async (module: string) =>
  (await compile({ 'tools.ts': module, 'Home.lite.tsx': home("'x'") })).swift.get(
    'ToolsModule.swift',
  )!

describe('shared modules in both formats', () => {
  it('reads the modules fixture into one model from TSX and from Vue', async () => {
    const fromTsx = await fixture('modules', 'Stays')
    const fromVue = await fixture('modulesVue', 'Stays')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/StayCard.vue', 'shared/Stays.vue'])
    expect(fromTsx.model.modules.map((module) => module.name)).toEqual(['figures', 'stays', 'text'])
    const stays = fromTsx.model.modules.find((module) => module.name === 'stays')!
    expect(stays.constants.map((constant) => constant.name)).toEqual(['kinds', 'taxRate', 'stays'])
    expect(stays.functions.find((fn) => fn.name === 'cents')!.exported).toBe(false)
  })

  it('writes a module as a Swift namespace of constants and functions', async () => {
    const { swift } = await fixture('modules', 'Stays')
    const stays = swift.get('StaysModule.swift')!
    expect(stays).toContain('enum StaysModule {')
    expect(stays).toContain('static let kinds: [String] = ["all", "city", "coast"]')
    expect(stays).toContain('static let taxRate: Double = 0.125')
    expect(stays).toContain(
      'Stay(id: "azul", name: "Casa Azul", city: "Porto", nightly: 120.5, tags: ["coast", "quiet"], note: nil)',
    )
    expect(stays).toContain(
      'static func total(_ stay: Stay, _ nights: Double, _ discount: Double?) -> Double {',
    )
    expect(stays).toContain(
      'guard let discount else { return StaysModule.cents((base * (1.0 + StaysModule.taxRate))) }',
    )
    expect(stays).toContain('TextModule.plural(Double(list.count), "stay")')
    expect(stays).toContain(
      'list.reduce(0.0, { (all: Double, stay: Stay) -> Double in (all + StaysModule.total(stay, nights, nil)) })',
    )
    expect(swift.get('Stays.swift')).toContain(
      'return (StaysModule.stays + self.extra).filter { (stay: Stay) -> Bool in StaysModule.matches(stay, self.kind) }',
    )
    expect(swift.get('MavisValues.swift')).toContain(
      'func mavisFixed(_ value: Double, _ digits: Int)',
    )
  })

  it('imports the module as written where Vue is generated', async () => {
    const { vue, native } = await fixture('modules', 'Stays')
    for (const output of [vue, native]) {
      const stays = output.get('Stays.vue')!
      expect(stays).toContain("import * as mavisStays from '#shared-ui/stays'")
      expect(stays).toContain("import * as mavisText from '#shared-ui/text'")
      expect(stays).toContain(
        'return [...mavisStays.stays, ...state.extra].filter((stay) => mavisStays.matches(stay, state.kind))',
      )
      expect(stays).toContain('mavisStays.total(stay, state.nights, undefined)')
      expect([...output.keys()].sort()).toEqual([
        'StayCard.vue',
        'Stays.vue',
        'runtime.ts',
        'types.ts',
      ])
    }
    const elsewhere = await compileProject(await readShared(join(portable, 'modules')), {
      root: 'Stays',
      shared: './shared',
    })
    expect(elsewhere.vue.get('Stays.vue')).toContain("import * as mavisStays from './shared/stays'")
  })

  it('names a module after its file and leaves no Swift for one with types only', async () => {
    const { swift, vue, model } = await compile({
      'types.ts': 'export type Price = { amount: number }\n',
      'price-list.ts':
        "import type { Price } from './types'\nexport const base: Price = { amount: 3 }\nexport const double = (price: Price): number => price.amount * 2\n",
      'Home.lite.tsx': home('twice(base)', "import { base, double as twice } from './price-list'"),
    })
    expect(model.modules.map((module) => module.name)).toEqual(['price-list', 'types'])
    expect([...swift.keys()]).not.toContain('TypesModule.swift')
    expect(swift.get('PriceListModule.swift')).toContain(
      'static let base: Price = Price(amount: 3.0)',
    )
    expect(swift.get('Home.swift')).toContain(
      'mavisString(PriceListModule.double(PriceListModule.base))',
    )
    expect(vue.get('Home.vue')).toContain("import * as mavisPriceList from '#shared-ui/price-list'")
    expect(vue.get('Home.vue')).toContain('{{ mavisPriceList.double(mavisPriceList.base) }}')
  })

  it('reads a Vue script constant computed by a module, and a call in its template', async () => {
    const { swift } = await compile({
      'tools.ts': 'export const twice = (value: number): number => value * 2\n',
      'Home.vue': screen(
        "import { twice } from './tools'\nconst four = twice(2)",
        '{{ four }} {{ twice(four) }}',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('_four = State(initialValue: ToolsModule.twice(2.0))')
    expect(view).toContain('\\(mavisString(ToolsModule.twice(self.four)))')
  })

  it('keeps the JavaScript meaning of text and number helpers in Swift', async () => {
    const tools = await swiftFor(
      [
        "export const parts = (text: string): string[] => text.split(',')",
        "export const first = (text: string): string => text.replace('a', 'b')",
        "export const every = (text: string): string => text.replaceAll('a', 'b')",
        'export const left = (text: string): string => text.padStart(4)',
        'export const right = (text: string, fill: string): string => text.padEnd(4, fill)',
        "export const position = (text: string): number => text.indexOf('x')",
        'export const tail = (text: string): string => text.slice(1)',
        'export const twice = (text: string): string => text.repeat(2)',
        'export const whole = (value: number): string => value.toFixed()',
        'export const number = (text: string): number => Number(text)',
        'export const flag = (on: boolean): number => Number(on)',
        'export const text = (value: number): string => String(value)',
        'export const finite = (value: number): boolean => Number.isFinite(value) && !Number.isNaN(value)',
        'export const integer = (value: number): boolean => Number.isInteger(value)',
        'export const found = (list: number[], value: number): number => list.indexOf(value)',
        'export const back = (list: string[]): string[] => list.toReversed()',
        'export const joined = (a: string[], b: string[]): string[] => [...a, "x", "y", ...b]',
        'export const cut = (value: number): number => Math.trunc(Math.sqrt(value))',
        '',
      ].join('\n'),
    )
    for (const line of [
      'return mavisSplit(text, ",")',
      'return mavisReplace(text, "a", "b", all: false)',
      'return mavisReplace(text, "a", "b", all: true)',
      'return mavisPad(text, 4.0, " ", start: true)',
      'return mavisPad(text, 4.0, fill, start: false)',
      'return mavisIndexOf(text, "x")',
      'return mavisSliceText(text, 1.0)',
      'return String(repeating: text, count: 2)',
      'return mavisFixed(value, 0)',
      'return mavisNumber(text)',
      'return (on ? 1.0 : 0.0)',
      'return mavisString(value)',
      'return (value.isFinite && !(value.isNaN))',
      'return mavisIsInteger(value)',
      'return mavisIndexOf(list, value)',
      'return Array(list.reversed())',
      'return (a + ["x", "y"] + b)',
      'return ((value).squareRoot()).rounded(.towardZero)',
    ])
      expect(tools).toContain(line)
  })

  it('ends a function that may give nothing with a return on the Mac', async () => {
    const tools = await swiftFor(
      'export function pick(list: string[], wanted: string): string | undefined {\n  if (list.includes(wanted)) return wanted\n}\nexport function other(value?: string): string | null {\n  if (value === undefined) return null\n  return value\n}\n',
    )
    expect(tools).toContain('static func pick(_ list: [String], _ wanted: String) -> String? {')
    expect(tools).toMatch(/return wanted\n\s+}\n\s+return nil\n/)
    expect(tools).toContain('guard let value else { return nil }')
  })
})

describe('optional properties of a TSX component', () => {
  it('gives each one the default every target uses', async () => {
    const { swift, vue, model } = await fixture('optional', 'Optional')
    const marker = swift.get('Marker.swift')!
    expect(marker).toContain(
      'init(label: String, strong: Bool? = nil, count: Double? = nil, onTap: @escaping (String) -> Void = { _ in }) {',
    )
    expect(swift.get('Optional.swift')).toContain(
      'init(title: String? = nil, onDone: @escaping () -> Void = { }) {',
    )
    expect(swift.get('Optional.swift')).toMatch(
      /Marker\(\n\s+label: "Second",\n\s+strong: false,\n\s+onTap: \{ \(_: String\) in\n\n\s+\}\n\s+\)/,
    )
    const generated = vue.get('Marker.vue')!
    expect(generated).toContain('strong: { type: Boolean, required: false, default: undefined },')
    expect(generated).toContain('count: { type: Number, required: false },')
    expect(generated).toContain(
      'onTap: { type: Function as PropType<(arg0: string) => void>, required: false },',
    )
    expect(generated).toContain('props.onTap?.(props.label)')
    expect(vue.get('Optional.vue')).toContain(
      '<Marker :label="\'Second\'" :strong="false" :onTap="() => {\n\n}" />',
    )
    expect(model.components.find((component) => component.name === 'Marker')!.props).toEqual([
      { name: 'label', type: { k: 'string' } },
      {
        name: 'strong',
        type: { k: 'optional', of: { k: 'boolean' } },
        default: { e: 'undefined', type: { k: 'optional', of: { k: 'boolean' } } },
      },
      {
        name: 'count',
        type: { k: 'optional', of: { k: 'number' } },
        default: { e: 'undefined', type: { k: 'optional', of: { k: 'number' } } },
      },
      { name: 'onTap', type: { k: 'function', params: [{ k: 'string' }] }, optional: true },
    ])
  })

  it('still asks for a property without ?', async () => {
    expect(
      await problems({
        'Row.lite.tsx':
          'export default function Row(props: { title: string; note?: string }) {\n  return <MText>{props.title}{props.note ?? ""}</MText>\n}\n',
        'Home.lite.tsx':
          'import Row from \'./Row.lite\'\nexport default function Home() {\n  return <MColumn><Row note="x" /></MColumn>\n}\n',
      }),
    ).toMatch(/shared\/Home\.lite\.tsx:3:20: .*title/)
  })
})

describe('what a shared module cannot hold for the Mac', () => {
  const inModule = (source: string, use = "'x'", imports = '') =>
    problems({ 'tools.ts': source, 'Home.lite.tsx': home(use, imports) })

  it.each([
    [
      'state of its own',
      'export let count = 0\n',
      'shared/tools.ts:1:1: A module has no state of its own: declare constants with const. State belongs to a component.',
    ],
    [
      'an async function',
      'export async function load(): Promise<number> {\n  return 1\n}\n',
      'shared/tools.ts:1:23: An async function does not reach the Mac yet: a module computes values (#340 tracks async work).',
    ],
    [
      'a function that returns nothing',
      'export function log(text: string) {}\n',
      'shared/tools.ts:1:17: log returns nothing. A function of a module computes a value: return it.',
    ],
    [
      'a change inside a function',
      'export type Box = { size: number }\nexport function grow(box: Box): number {\n  box.size += 1\n  return box.size\n}\n',
      'shared/tools.ts:3:3: A function of a module computes a value and changes nothing: return the result.',
    ],
    [
      'a parameter with a default',
      'export const twice = (value = 1): number => value * 2\n',
      'shared/tools.ts:1:23: Function parameters are simple typed names; one that can be left out is name?: type.',
    ],
    [
      'an optional parameter before a required one',
      'export const add = (a: number | undefined, b: number): number => (a ?? 0) + b\n',
      'shared/tools.ts:1:21: Parameters that can be left out come last.',
    ],
    [
      'a generic function',
      'export function first<T>(list: T[]): T | undefined {\n  return list[0]\n}\n',
      'shared/tools.ts:1:17: A function of a module is a plain function: no generics or generators.',
    ],
    [
      'a regular expression',
      "export const clean = (text: string): string => text.replace(/a/g, '')\n",
      'shared/tools.ts:1:61: Regular expressions do not reach the Mac: JavaScript and Swift read them differently. Give replace the text itself.',
    ],
    [
      'parseInt',
      'export const read = (text: string): number => parseInt(text, 10)\n',
      'shared/tools.ts:1:47: parseInt reads the start of a text and ignores the rest, which the Mac does not repeat; use Number(text).',
    ],
    [
      'toFixed with a computed number of decimals',
      'export const fixed = (value: number, digits: number): string => value.toFixed(digits)\n',
      'shared/tools.ts:1:65: toFixed takes the number of decimals written out, from 0 to 100.',
    ],
    [
      'a class',
      'export class Counter {}\n',
      'shared/tools.ts:1:1: A shared module declares types, constants (export const) and functions that compute a value (export function).',
    ],
    [
      'a name a target reserves',
      'export const mavisRate = 2\n',
      'shared/tools.ts:1:14: Constant mavisRate collides with a reserved word in a generated target.',
    ],
    [
      'a list of mixed values',
      "export const mixed = ['a', 1] as const\n",
      'shared/tools.ts:1:14: A list holds values of one type; readonly ["a", 1] mixes them.',
    ],
    [
      'something of the browser',
      'export const width = (): number => window.innerWidth\n',
      /shared\/tools\.ts:1:36: Cannot find name 'window'/,
    ],
  ])('fails on %s', async (_name, source, message) => {
    const found = await inModule(source)
    if (typeof message === 'string') expect(found).toBe(message)
    else expect(found).toMatch(message)
  })

  it.each([
    [
      'a function read as a value',
      '`${twice}`',
      'shared/Home.lite.tsx:4:21: twice is a function: call it, as twice(…).',
    ],
    [
      'a constant called',
      'rate()',
      /shared\/Home\.lite\.tsx:4:18: This expression is not callable/,
    ],
    [
      'too many arguments',
      'twice(1, 2, 3)',
      /shared\/Home\.lite\.tsx:4:\d+: Expected 1-2 arguments, but got 3/,
    ],
  ])('fails on %s', async (_name, use, message) => {
    const found = await inModule(
      'export const rate = 2\nexport const twice = (value: number, by?: number): number => value * (by ?? rate)\n',
      use,
      "import { rate, twice } from './tools'\n",
    )
    if (typeof message === 'string') expect(found).toBe(message)
    else expect(found).toMatch(message)
  })

  it('says where an import cannot come from, before any type is checked', async () => {
    const files = shared({
      'store.ts':
        "import { ref } from 'vue'\nexport const count = ref(0)\nexport const twice = (value: number): number => value * 2\n",
      'routes.ts':
        "import Home from './Home.vue'\nexport const routes = [{ path: '/', component: Home }]\n",
      'net.ts': "import axios from 'axios'\nexport const client = axios\n",
      'Home.vue': screen("import { twice } from './store'", '{{ twice(2) }}'),
      'Wrong.ts': 'export const value = 1\n',
    })
    const report = await checkShared(files, mavis)
    const first = (file: string) =>
      report.find((item: { file: string }) => item.file === file).problems[0]
    expect(first('shared/store.ts')).toEqual({
      line: 1,
      column: 1,
      message:
        'A shared module declares types, constants and functions that compute values. State kept with ref, computed or inject (a store, a composable) does not reach the Mac yet (#340).',
    })
    // A file that brings in screens is the route table, not a module: it waits for its screens.
    expect(first('shared/routes.ts').message).toBe(
      'It shows shared/Home.vue, which is not ready for the Mac.',
    )
    expect(first('shared/net.ts').message).toBe(
      'axios is not available to a shared module on the Mac: it imports other modules of the shared folder, as ./name.',
    )
    expect(first('shared/Home.vue').message).toBe(
      'It uses shared/store.ts, which is not ready for the Mac.',
    )
    expect(first('shared/Wrong.ts').message).toBe(
      'A .ts file is a shared module: name it in lowercase, such as types.ts or price-list.ts.',
    )
  })

  it('keeps a module from taking the name of a record or a component on the Mac', async () => {
    expect(
      await problems({
        'tools.ts':
          'export type ToolsModule = { id: string }\nexport const one: ToolsModule = { id: "a" }\n',
        'Home.lite.tsx': home('one.id', "import { one } from './tools'"),
      }),
    ).toBe(
      'shared/tools.ts: This module is ToolsModule on the Mac, the name a record type already has; rename one.',
    )
  })
})
