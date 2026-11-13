import { describe, expect, it } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The compiler ships in the experimental template.
import {
  compileProject,
  readShared,
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
const compile = (files: Record<string, string>, root = 'Home') =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text])), {
    root,
  })

describe('the actual directory screens', () => {
  it('generates identical guarded views from the replay fixtures', async () => {
    const fixture = async (name: string) =>
      compileProject(await readShared(join(import.meta.dirname, 'portable', name)), {
        root: 'GuardedRecord',
      })
    const vue = await fixture('guardedRecordVue')
    const tsx = await fixture('guardedRecord')
    expect((vue.swift.get('GuardedRecord.swift') as string).split('\n').slice(1)).toEqual(
      (tsx.swift.get('GuardedRecord.swift') as string).split('\n').slice(1),
    )
  })

  it('compiles the complete routed example without rewriting the screens', async () => {
    const root = join(import.meta.dirname, '../packages/create-mavis/templates/directory/shared')
    const files = Object.fromEntries(
      await Promise.all(
        (await readdir(root)).map(async (name) => [name, await readFile(join(root, name), 'utf8')]),
      ),
    )
    const output = await compile(files, 'Directory')
    expect(output.swift.get('Directory.swift')).toContain(
      '.lowercased(with: Locale(identifier: "en"))',
    )
    expect(output.swift.get('Details.swift')).toContain('if let mavisValue = self.entry')
    expect(output.swift.get('Details.swift')).toContain('(mavisValue).name')
    expect(output.swift.get('Edit.swift')).toContain('EditMavisState')
  })

  it('narrows only the checked view branch and preserves the expression in generated Vue', async () => {
    const output = await compile({
      'Home.vue': `<script setup lang="ts">
import { computed, ref } from 'vue'
type Item = { id: string; name: string }
const items = ref<Item[]>([{ id: 'one', name: 'First' }])
const item = computed(() => items.value.find(value => value.id === 'one'))
</script><template><MColumn><MText v-if="item">{{ item.name }}</MText><MText v-else>Missing</MText></MColumn></template>`,
    })
    expect(output.swift.get('Home.swift')).toContain('if let mavisValue = self.item')
    const invalid = `<script setup lang="ts">import { ref } from 'vue'
type Item = { name: string }
const item = ref<Item | undefined>(undefined)
</script><template><MColumn><MText v-if="item">{{ item.name }}</MText><MText v-else>{{ item.name }}</MText></MColumn></template>`
    await expect(compile({ 'Home.vue': invalid })).rejects.toThrow()
  })

  it('shares the guarded branch model with TSX', async () => {
    const output = await compile({
      'Home.lite.tsx': `import { useStore, Show } from '@builder.io/mitosis'
type Item = { id: string; name: string }
export default function Home() {
  const state = useStore({ items: [{ id: 'one', name: 'First' }] as Item[], get item() { return state.items.find(value => value.id === 'one') } })
  return <MColumn><Show when={state.item !== undefined}><MText>{state.item!.name}</MText></Show></MColumn>
}`,
    })
    expect(output.swift.get('Home.swift')).toContain('if let mavisValue = self.item')
    expect(output.vue.get('Home.vue')).toContain('(state.item).name')
  })
})
