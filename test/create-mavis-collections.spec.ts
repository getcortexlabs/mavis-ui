import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships ESM.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const root = resolve(import.meta.dirname, 'portable/collections')
const compile = (source: string) =>
  compileProject(
    new Map([
      ['shared/calculations.ts', source],
      ['shared/Home.vue', '<template><MText>Collections</MText></template>'],
    ]),
    { root: 'Home' },
  )

describe('local working Set and Map', () => {
  it('preserves the JavaScript contract in fixtures for both front ends', async () => {
    const source = await readFile(resolve(root, 'shared/calculations.ts'), 'utf8')
    const exports: Record<string, () => string> = {}
    new Function(
      'exports',
      ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText,
    )(exports)
    expect(exports.setSummary!()).toBe('blue,green,red:3:true:false:0')
    expect(exports.mapSummary!()).toBe('b,a:3,2:4:0:true:0')
    expect(exports.keySummary!()).toBe('2:2:true:Infinity:last')
    const tsx = await compileProject(await readShared(root), { root: 'Home' })
    const vue = await compileProject(await readShared(root + 'Vue'), { root: 'Home' })
    expect(tsx.swift.get('CalculationsModule.swift')).toEqual(
      vue.swift.get('CalculationsModule.swift'),
    )
    expect(tsx.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      vue.swift.get('Home.swift').split('\n').slice(1),
    )
    expect(tsx.swift.get('CalculationsModule.swift')).toContain(
      'let alias: MavisSet<String> = selected',
    )
    expect(tsx.swift.get('MavisValues.swift')).toContain('a.utf16.elementsEqual(b.utf16)')
    expect(tsx.swift.get('MavisValues.swift')).toContain('a.isNaN && b.isNaN')
  })

  it.each([
    ['export const collection = new Set([1])', 'local working collections'],
    ['export function leak(): Set<string> { return new Set(["a"]) }', 'local working collections'],
    [
      'export function mutate(items: Map<string, number>): number { return items.size }',
      'local working collections',
    ],
    [
      'export function identity(): number { const objects = new Set([{id:1}]); return objects.size }',
      'object identity',
    ],
    [
      'export function iterator(): string[][] { const map = new Map<string,string>(); return Array.from(map) }',
      'Array.from accepts',
    ],
  ])('diagnoses unsupported collection boundaries: %s', async (source, message) => {
    await expect(compile(source)).rejects.toThrow(message)
  })

  it('emits local collection expressions directly in generated Vue actions', async () => {
    const out = await compileProject(
      new Map([
        [
          'shared/Home.lite.tsx',
          `
import { useStore } from '@builder.io/mitosis'
export default function Home(){const state=useStore({result:'', calculate(){const seen=new Set(['a','a']);seen.add('b');state.result=Array.from(seen).join(',')}});return <MButton text={state.result} onClick={()=>state.calculate()}/>}
`,
        ],
      ]),
      { root: 'Home' },
    )
    expect(out.vue.get('Home.vue')).toContain("new Set(['a', 'a'])")
    expect(out.vue.get('Home.vue')).toContain("seen.add('b')")
    expect(out.vue.get('Home.vue')).toContain('Array.from(seen.values())')
  })
})
