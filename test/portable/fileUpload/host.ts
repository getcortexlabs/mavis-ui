import type { App } from 'vue'
import type { FileHandle } from '@getcortexlabs/mavis-core'
import { createUploads, uploadsKey } from './uploads'
export function install(app: App) {
  const resources = new WeakMap<FileHandle, Uint8Array>()
  let attempts = 0
  app.provide(
    uploadsKey,
    createUploads({
      async select(files) {
        await files.select({
          async pick() {
            const handle = {} as FileHandle
            resources.set(handle, new Uint8Array(64))
            return [
              {
                handle,
                name: 'notes.txt',
                size: 64,
                type: 'text/plain',
                release() {
                  resources.delete(handle)
                },
              },
            ]
          },
        })
      },
      async upload(context) {
        const bytes = resources.get(context.handle)
        if (!bytes) throw new Error('Released file')
        context.progress(0, bytes.length)
        await new Promise<void>((resolve) => setTimeout(resolve, 30))
        if (attempts++ === 0) throw new Error('Offline')
        context.progress(bytes.length, bytes.length)
        await new Promise<void>((resolve) => setTimeout(resolve, 30))
      },
    }),
  )
}
