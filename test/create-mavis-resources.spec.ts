import { describe, expect, it } from 'vitest'
// @ts-expect-error The compiler ships in the experimental template.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const compile = (files: Record<string, string>) =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text])), {
    root: 'Home',
  })
const options =
  "{ initial: [{ id: 'one', name: 'notes.txt', status: 'selected' }], multiple: true, accept: ['text/*'], maxCount: 3 }"
const vue = `<script setup lang="ts">
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
const files = useFileSelection(${options})
async function clear() { if (files.hasFile('one')) files.remove('one'); files.clear() }
</script><template><MColumn><MFilePicker label="Attachments" :selection="files" /><MButton text="Clear" @click="clear" /></MColumn></template>`
const tsx = `import { useStore } from '@builder.io/mitosis'
export default function Home() {
  const files = useFileSelection(${options})
  const state = useStore({ async clear() { if (files.hasFile('one')) files.remove('one'); files.clear() } })
  return <MColumn><MFilePicker label="Attachments" selection={files} /><MButton text="Clear" onClick={() => state.clear()} /></MColumn>
}`

describe('owned composable controllers', () => {
  it('uses the same controller and lifetime contract in both source formats', async () => {
    const fromVue = await compile({ 'Home.vue': vue })
    const fromTsx = await compile({ 'Home.lite.tsx': tsx })
    const native = fromVue.swift.get('Home.swift') as string
    expect(native.split('\n').slice(1)).toEqual(
      (fromTsx.swift.get('Home.swift') as string).split('\n').slice(1),
    )
    expect(native).toContain('@StateObject private var files: MavisFileSelection')
    expect(native).toContain('_files = StateObject(wrappedValue: MavisFileSelection(initial:')
    expect(native).toContain('let files: MavisFileSelection')
    expect(native).toContain('files: self.files')
    expect(native).toContain('context.files.dispose()')
    expect(native).toContain('self.files.remove("one")')
    expect(native).not.toContain('.onDisappear')
    const generated = fromTsx.vue.get('Home.vue') as string
    expect(generated).toContain('const files = useFileSelection({ initial:')
    expect(generated).toContain("files.remove('one')")
    expect(generated).toContain('files.clear()')
    expect(generated).toContain(':selection="files"')
  })

  it('initializes controllers even when a component has no local state or properties', async () => {
    const output = await compile({
      'Home.vue': `<script setup lang="ts">import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
const files = useFileSelection()
</script><template><MFilePicker label="Files" :selection="files" /></template>`,
    })
    expect(output.swift.get('Home.swift')).toContain(
      'init() {\n        _files = StateObject(wrappedValue: MavisFileSelection())',
    )
    expect(output.swift.has('MavisLifetime.swift')).toBe(true)
  })

  it('keeps toast queues available after an action suspends without retaining its lifetime owner', async () => {
    const output = await compile({
      'Home.vue': `<script setup lang="ts">import { useToast } from '@getcortexlabs/mavis-core/vue'
const toast = useToast()
async function notify() { toast.show({ message: 'Saved' }) }
</script><template><MColumn><MToast :controller="toast" /><MButton text="Save" @click="notify" /></MColumn></template>`,
    })
    expect(output.swift.get('Home.swift')).toContain('let toast: MavisToastQueue')
    expect(output.swift.get('Home.swift')).toContain('HomeMavisContext(toast: self.toast)')
  })
})
