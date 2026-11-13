import type { App } from 'vue'
import {
  createFileSelection,
  type FileHandle,
  type FileUploadContext,
  type SelectedFile,
} from '@getcortexlabs/mavis-core'
import { createFileProbe, fileProbeKey } from './probe'
const pause = (time: number) => new Promise<void>((resolve) => setTimeout(resolve, time))
const active = new Set<FileHandle>()
const chosen = (name = 'notes.txt'): SelectedFile => {
  const handle = {} as FileHandle
  active.add(handle)
  return {
    name,
    size: 64,
    type: 'text/plain',
    handle,
    release() {
      active.delete(handle)
    },
  }
}
const picker = (name = 'notes.txt') => ({ pick: async () => [chosen(name)] })
export function install(app: App) {
  app.provide(
    fileProbeKey,
    createFileProbe({
      async run() {
        let checks = 0
        const check = (value: boolean) => {
          if (!value) throw new Error(`File check ${checks + 1}`)
          checks++
        }
        let sent = 0
        const metadata = createFileSelection({
          initial: [{ id: 'stored', name: 'stored.txt', status: 'uploaded' }],
          upload: async () => {
            sent++
          },
        })
        await metadata.upload('stored')
        check(
          !metadata.hasFile('stored') &&
            sent === 0 &&
            metadata.state.items[0]?.status === 'uploaded',
        )
        metadata.dispose()

        const limits = createFileSelection({
          multiple: true,
          accept: ['.txt'],
          maxCount: 1,
          maxSize: 100,
        })
        await limits.select(picker())
        await limits.select(picker('bad.pdf'))
        check(limits.state.error?.code === 'count' && limits.state.items.length === 1)
        limits.dispose()

        let complete: () => void = () => {}
        const progress = createFileSelection({
          upload: async (context) => {
            context.progress(64, 64)
            await new Promise<void>((resolve) => {
              complete = resolve
            })
          },
        })
        await progress.select(picker())
        const progressTask = progress.upload('file-1')
        await pause(2)
        const pending =
          progress.state.items[0]?.status === 'uploading' && progress.state.items[0]?.progress === 1
        complete()
        await progressTask
        check(pending && progress.state.items[0]?.status === 'uploaded')
        progress.dispose()

        let cancelled = 0
        let attempts = 0
        let late: FileUploadContext | undefined
        let finish: () => void = () => {}
        const cancellation = createFileSelection({
          upload: async (context) => {
            attempts++
            if (attempts === 1) {
              late = context
              context.cancellation.onCancel(() => {
                cancelled++
              })
              await new Promise<void>((resolve) => {
                finish = resolve
              })
            }
          },
        })
        await cancellation.select(picker())
        const cancelledTask = cancellation.upload('file-1')
        await pause(2)
        cancellation.cancel('file-1')
        late!.progress(100, 100)
        finish()
        await cancelledTask
        const kept =
          cancelled === 1 &&
          cancellation.hasFile('file-1') &&
          cancellation.state.items[0]?.status === 'cancelled' &&
          cancellation.state.items[0]?.progress === undefined
        await cancellation.retry('file-1')
        check(kept && attempts === 2 && cancellation.state.items[0]?.status === 'uploaded')
        cancellation.dispose()

        let failures = 0
        const retry = createFileSelection({
          upload: async () => {
            if (failures++ === 0) throw new Error('Offline')
          },
        })
        await retry.select(picker())
        await retry.upload('file-1')
        const failed =
          retry.state.items[0]?.status === 'failed' && retry.state.items[0]?.error === 'Offline'
        await retry.retry('file-1')
        check(failed && retry.state.items[0]?.status === 'uploaded')
        retry.dispose()

        let disposed = 0
        let notifications = 0
        let last: FileUploadContext | undefined
        let release: () => void = () => {}
        const gone = createFileSelection({
          upload: async (context) => {
            last = context
            context.cancellation.onCancel(() => {
              disposed++
            })
            await new Promise<void>((resolve) => {
              release = resolve
            })
          },
        })
        await gone.select(picker())
        gone.subscribe(() => {
          notifications++
        })
        const goneTask = gone.upload('file-1')
        await pause(2)
        const before = notifications
        gone.dispose()
        last!.progress(64, 64)
        release()
        await goneTask
        check(
          disposed === 1 &&
            notifications === before &&
            !gone.hasFile('file-1') &&
            !active.has(last!.handle),
        )

        const observed = createFileSelection({
          initial: [{ id: 'one', name: 'one.txt', status: 'selected' }],
        })
        let snapshots = 0
        let size = -1
        const unsubscribe = observed.subscribe((state) => {
          snapshots++
          size = state.items.length
        })
        const silent = snapshots === 0
        observed.remove('one')
        unsubscribe()
        observed.clear()
        check(silent && snapshots === 1 && size === 0)
        observed.dispose()
        return `${checks} file checks passed`
      },
    }),
  )
}
