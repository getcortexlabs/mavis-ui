import { describe, expect, it } from 'vitest'
// @ts-expect-error The compiler ships in the experimental template.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
const compile = (files: Record<string, string>) =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text])), {
    root: 'Home',
  })
const store = `import { inject, type InjectionKey } from 'vue'
export type Result = { id: string; label: string }
export interface SearchService { search(query: string): Promise<Result[]> }
export function createSearch(service: SearchService) {
  async function load(query: string) { return await service.search(query) }
  async function search(query: string) {
    const results = await load(query)
    return results.filter(item => item.label.length > 0)
  }
  return { search }
}
export type Search = ReturnType<typeof createSearch>
export const searchKey: InjectionKey<Search> = Symbol('search')
export function useSearch() { const store = inject(searchKey); if (!store) throw new Error('Install search'); return store }
`
const screen = `<script setup lang="ts">
import { ref } from 'vue'
import { useSearch } from './search'
const search = useSearch()
const count = ref(0)
async function run() { try { const results = await search.search('all'); count.value = results.length } catch { count.value = -1 } }
</script><template><MColumn><MText>{{ count }}</MText><MButton text="Search" @click="run" /></MColumn></template>`

describe('typed values returned by async store actions', () => {
  it('preserves host errors through private and public async actions and consumes their result', async () => {
    const output = await compile({ 'search.ts': store, 'Home.vue': screen })
    const stores = output.swift.get('MavisStores.swift') as string
    expect(stores).toContain('func load(_ query: String) async throws -> [Result]')
    expect(stores).toContain('func search(_ query: String) async throws -> [Result]')
    expect(stores).toContain('let mavisReturn: [Result] = try await self.service.search(query)')
    expect(stores).toContain('let results: [Result] = try await self.load(query)')
    expect(output.swift.get('Home.swift')).toContain(
      'let results: [Result] = try await self.search.search("all")',
    )
  })

  it('keeps unobserved host failures diagnosed', async () => {
    await expect(
      compile({
        'search.ts': store,
        'Home.vue': screen.replace(
          "const results = await search.search('all'); count.value = results.length",
          "search.search('all')",
        ),
      }),
    ).rejects.toThrow('can fail, and nothing sees it')
  })

  it('does not turn synchronous store methods into computed value functions', async () => {
    await expect(
      compile({
        'search.ts': store
          .replace(
            'async function load(query: string) { return await service.search(query) }',
            'function load(query: string) { return query }',
          )
          .replace(
            'const results = await load(query)',
            'const results = await service.search(load(query))',
          ),
        'Home.vue': screen,
      }),
    ).rejects.toThrow('returns a value')
  })
})
