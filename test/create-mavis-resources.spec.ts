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

const uploads = (
  imported = "import type { FileUploadContext } from '@getcortexlabs/mavis-core'",
) => `${imported}
import { inject, type InjectionKey } from 'vue'
export interface UploadHost { send(context: FileUploadContext): Promise<void> }
export function createUploads(host: UploadHost) {
  async function send(context: FileUploadContext) { await host.send(context) }
  return { send }
}
export type Uploads = ReturnType<typeof createUploads>
export const uploadsKey: InjectionKey<Uploads> = Symbol('uploads')
export function useUploads() { const uploads = inject(uploadsKey); if (!uploads) throw new Error('Install uploads'); return uploads }
`

describe('typed host resource contracts', () => {
  it('preserves the opaque upload context across a shared store and host service', async () => {
    const output = await compile({
      'uploads.ts': uploads(),
      'Home.vue': `<script setup lang="ts">import { useUploads } from './uploads'
const uploads = useUploads()
</script><template><MText>Host transport</MText></template>`,
    })
    const stores = output.swift.get('MavisStores.swift') as string
    expect(stores).toContain('func send(_ context: MavisFileUploadContext) async throws')
    expect(stores).toContain('try await self.host.send(context)')
    expect(stores).not.toContain('struct FileUploadContext')
  })

  it.each([
    ["import { FileUploadContext } from '@getcortexlabs/mavis-core'", 'type-only'],
    [
      "import type { ArbitraryType as FileUploadContext } from '@getcortexlabs/mavis-core'",
      'type-only',
    ],
    ["import * as Core from '@getcortexlabs/mavis-core'", 'type-only'],
  ])('rejects unlisted or runtime host imports: %s', async (source, message) => {
    await expect(
      compile({
        'uploads.ts': uploads(source),
        'Home.vue': '<template><MText>Host</MText></template>',
      }),
    ).rejects.toThrow(message)
  })
})

it('passes the owned controller to a typed host without serializing or recreating it', async () => {
  const host = uploads().replaceAll('FileUploadContext', 'FileSelectionController')
  const output = await compile({
    'uploads.ts': host,
    'Home.vue': `<script setup lang="ts">
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
import { useUploads } from './uploads'
const files = useFileSelection()
const uploads = useUploads()
async function choose() { try { await uploads.send(files) } catch {} }
</script><template><MColumn><MFilePicker label="Files" :selection="files" /><MButton text="Choose" @click="choose" /></MColumn></template>`,
  })
  expect(output.swift.get('MavisStores.swift')).toContain(
    'func send(_ context: MavisFileSelection) async throws',
  )
  expect(output.swift.get('Home.swift')).toContain('try await self.uploads.send(self.files)')
})
