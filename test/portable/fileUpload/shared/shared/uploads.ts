import { inject, type InjectionKey } from 'vue'
import type { FileSelectionController, FileUploadContext } from '@getcortexlabs/mavis-core'
export interface UploadService {
  select(files: FileSelectionController): Promise<void>
  upload(context: FileUploadContext): Promise<void>
}
export function createUploads(host: UploadService) {
  async function select(files: FileSelectionController) {
    await host.select(files)
  }
  async function upload(context: FileUploadContext) {
    await host.upload(context)
  }
  return { select, upload }
}
export type Uploads = ReturnType<typeof createUploads>
export const uploadsKey: InjectionKey<Uploads> = Symbol('uploads')
export function useUploads() {
  const store = inject(uploadsKey)
  if (!store) throw new Error('Install uploads')
  return store
}
