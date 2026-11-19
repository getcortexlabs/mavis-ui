import { describe, expect, it } from 'vitest'
// @ts-expect-error The portable compiler is shipped as JavaScript.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const compile = (files: Record<string, string>) =>
  compileProject(
    new Map(Object.entries(files).map(([path, source]) => [`shared/${path}`, source])),
    { root: 'Home' },
  )
const vue = (script: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\n${script}\n</script>\n<template><MButton @click="change">Change</MButton></template>`
const types =
  'export type Box = { size: number }\nexport const names: string[] = ["a"]\nexport const box: Box = { size: 1 }\n'
const diagnostic = /shared\/Home\.(vue|lite\.tsx):\d+:\d+: .*share a mutable list or record/

describe('portable list and record ownership', () => {
  it.each([
    [
      'Vue record alias',
      'Home.vue',
      vue(`import { type Box } from './tools'
const first = ref<Box>({ size: 1 })
const second = ref<Box>({ size: 2 })
function change() { second.value = first.value; first.value.size++ }`),
    ],
    [
      'TSX record alias',
      'Home.lite.tsx',
      `import { useStore } from '@builder.io/mitosis'
import { type Box } from './tools'
export default function Home() {
  const state = useStore({ first: { size: 1 } as Box, second: { size: 2 } as Box,
    change() { state.second = state.first; state.first.size++ } })
  return <MButton text="Change" onClick={() => state.change()} />
}`,
    ],
    [
      'array alias',
      'Home.vue',
      vue(`const first = ref<string[]>(['a'])
const second = ref<string[]>([])
function change() { second.value = first.value; first.value.push('b') }`),
    ],
    [
      'local snapshot alias',
      'Home.vue',
      vue(`const names = ref<string[]>(['a'])
const count = ref(0)
function change() { const previous = names.value; names.value.push('b'); count.value = previous.length }`),
    ],
    [
      'module function returns its list',
      'Home.vue',
      vue(`import { borrowed } from './tools'
const names = ref(borrowed())
function change() { names.value.push('b') }`),
    ],
    [
      'module field is still borrowed',
      'Home.vue',
      vue(`import { group } from './tools'
const names = ref(group.names)
function change() { names.value.push('b') }`),
    ],
    [
      'shallow record copy retains a nested list',
      'Home.vue',
      vue(`import { type Group } from './tools'
const first = ref<Group>({ names: ['a'] })
const second = ref<Group>({ names: [] })
function change() { second.value = { ...first.value }; first.value.names.push('b') }`),
    ],
    [
      'two fields retain the same mutable record',
      'Home.vue',
      vue(`import { box, type Pair } from './tools'
const pair = ref<Pair>({ left: box, right: box })
function change() { pair.value.left.size++ }`),
    ],
    [
      'a copied list still borrows mutable record elements',
      'Home.vue',
      vue(`import { boxes, type Box } from './tools'
const list = ref([...boxes])
const edited = ref<Box>({ size: 0 })
function change() { edited.value.size++ }`),
    ],
  ])('rejects %s before emitting divergent targets', async (_label, path, source) => {
    await expect(
      compile({
        'tools.ts':
          types +
          `export type Group = { names: string[] }
export type Pair = { left: Box; right: Box }
export const group: Group = { names: ['a'] }
export const boxes: Box[] = [box]
export function borrowed(): string[] { return names }
`,
        [path]: source,
      }),
    ).rejects.toThrow(diagnostic)
  })

  it('accepts independent copies, including mutable nested values', async () => {
    const result = await compile({
      'tools.ts':
        types +
        'export type Group = { names: string[] }\nexport function copied(): string[] { return [...names] }',
      'Home.vue': vue(`import { copied, type Box, type Group } from './tools'
const names = ref(copied())
const first = ref<Box>({ size: 1 })
const second = ref<Box>({ size: 2 })
const group = ref<Group>({ names: [] })
function change() {
  const before = [...names.value]
  names.value.push('b')
  second.value = { ...first.value }
  first.value.size++
  group.value = { ...group.value, names: [...before] }
}`),
    })
    expect(result.swift.has('Home.swift')).toBe(true)
    expect(result.direct).toContain('shared/Home.vue')
  })

  it('rejects a module function that puts one fresh list in two record fields', async () => {
    await expect(
      compile({
        'tools.ts': `export type Pair = { left: string[]; right: string[] }
export function duplicated(): Pair { const names: string[] = ['a']; return { left: names, right: names } }`,
        'Home.vue': vue(`import { duplicated } from './tools'
const pair = ref(duplicated())
function change() { pair.value.left.push('b') }`),
      }),
    ).rejects.toThrow(diagnostic)
  })

  it('checks child state against mutations discovered later in its parent', async () => {
    await expect(
      compile({
        'tools.ts': types,
        'Child.vue': `<script setup lang="ts">
import { ref } from 'vue'
import type { Box } from './tools'
const props = defineProps<{ box: Box }>()
const snapshot = ref(props.box)
</script><template><MText>{{ snapshot.size }}</MText></template>`,
        'Home.vue': `<script setup lang="ts">
import { ref } from 'vue'
import type { Box } from './tools'
import Child from './Child.vue'
const first = ref<Box>({ size: 1 })
function change() { first.value.size++ }
</script><template><MColumn><Child :box="first" /><MButton @click="change">Change</MButton></MColumn></template>`,
      }),
    ).rejects.toThrow(/shared\/Child.vue:\d+:\d+: .*share a mutable list or record/)
  })

  it('does not treat a function parameter as a fresh allocation', async () => {
    await expect(
      compile({
        'tools.ts': 'export function identity(names: string[]): string[] { return names }',
        'Home.vue': vue(`import { identity } from './tools'
const names = ref<string[]>(['a'])
const second = ref<string[]>([])
function change() { second.value = identity(names.value); names.value.push('b') }`),
      }),
    ).rejects.toThrow(diagnostic)
  })

  it('rejects a model event retained in an array that is mutated in place', async () => {
    await expect(
      compile({
        'Home.vue': `<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '#mavis'
const selected = ref<ChoiceValue[]>([])
function change() { selected.value.push('b') }
</script><template><MColumn><MMultiSelect label="Selected" v-model="selected" :options="[{ value: 'a', label: 'A' }]" /><MButton @click="change">Change</MButton></MColumn></template>`,
      }),
    ).rejects.toThrow(diagnostic)
  })

  it('accepts shared values when updates replace them without mutating their contents', async () => {
    const result = await compile({
      'Home.vue': vue(`const first = ref<string[]>(['a'])
const second = ref<string[]>([])
function change() { second.value = first.value; first.value = [...first.value, 'b'] }`),
    })
    expect(result.swift.has('Home.swift')).toBe(true)
  })
})
