import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createFileSelection,
  acceptsFile,
  type FileHandle,
  type FilePickerAdapter,
  type FileSelectionController,
  type FileUploadContext,
  type SelectedFile,
} from '../packages/core/src/files.js'
import { useFileSelection } from '../packages/core/src/vue/files.js'
import { MFilePicker } from '../packages/web/src/components/MFilePicker.js'
import { node, renderer } from './renderer.js'

// This renderer has no DOM; browser tests cover actual button interactions.
vi.mock('../packages/web/src/motion.ts', async (original) => ({
  ...(await original<typeof import('../packages/web/src/motion.js')>()),
  usePressFeedback: () => ({}),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function file(
  name = 'receipt.pdf',
  size: number | undefined = 24,
  type = 'application/pdf',
): SelectedFile {
  return { name, size, type, handle: Object.freeze({}) as FileHandle, release: vi.fn() }
}
function picker(...files: SelectedFile[]): FilePickerAdapter {
  return { pick: vi.fn(async () => files) }
}
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}
afterEach(() => vi.useRealTimers())

describe('file selection ownership', () => {
  it('exposes focus and blur without selecting files and blocks disabled or pending focus', async () => {
    const selection = createFileSelection()
    const disabled = ref(false)
    const handle = ref<InstanceType<typeof MFilePicker>>()
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(MFilePicker, { ref: handle, selection, label: 'Receipts', disabled: disabled.value }),
    })
    app.mount(root)
    const focus = vi.fn()
    const blur = vi.fn()
    Object.assign(root.children[0]!, { querySelector: () => ({ focus, blur }) })
    handle.value!.focus()
    handle.value!.blur()
    expect(focus).toHaveBeenCalledOnce()
    expect(blur).toHaveBeenCalledOnce()
    expect(selection.state.picking).toBe(false)
    expect(selection.state.items).toHaveLength(0)
    disabled.value = true
    await nextTick()
    handle.value!.focus()
    expect(focus).toHaveBeenCalledOnce()
    disabled.value = false
    await nextTick()
    const result = deferred<SelectedFile[] | null>()
    const pending = selection.select({ pick: () => result.promise })
    handle.value!.focus()
    expect(focus).toHaveBeenCalledOnce()
    result.resolve(null)
    await pending
    app.unmount()
    selection.dispose()
  })

  it('opens only on explicit selection and keeps SSR descriptors portable', async () => {
    vi.useFakeTimers()
    const upload = vi.fn()
    const extra = {
      id: 'remote',
      name: 'Prior receipt.pdf',
      status: 'uploaded' as const,
      native: { path: '/private/secret' },
    }
    const selection = createFileSelection({ initial: [extra], upload })
    const html = await renderToString(
      createSSRApp({ render: () => h(MFilePicker, { selection, label: 'Receipts' }) }),
    )
    expect(html).toContain('Prior receipt.pdf')
    expect(html).not.toContain('input type="file"')
    expect(JSON.stringify(selection.state)).not.toMatch(/native|secret|path|handle|preview/)
    expect(selection.hasFile('remote')).toBe(false)
    expect(Object.isFrozen(selection.state.items[0])).toBe(true)
    await selection.upload('remote')
    expect(upload).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    selection.dispose()
  })

  it('replaces only after a valid selection; cancellation retains the previous file', async () => {
    const first = file()
    const rejected = file('large.pdf', 100)
    const selection = createFileSelection({ accept: ['.pdf'], maxSize: 50 })
    await selection.select(picker(first))
    const id = selection.state.items[0]!.id
    await selection.select({ pick: async () => null })
    expect(selection.state.items[0]!.id).toBe(id)
    await selection.select(picker(rejected))
    expect(selection.state.error?.code).toBe('size')
    expect(selection.state.items[0]!.id).toBe(id)
    expect(rejected.release).toHaveBeenCalledOnce()
    const second = file()
    await selection.select(picker(second))
    expect(selection.state.items[0]!.id).not.toBe(id)
    expect(first.release).toHaveBeenCalledOnce()
    selection.dispose()
    selection.dispose()
    expect(second.release).toHaveBeenCalledOnce()
  })

  it('validates type, count and known sizes atomically while allowing unknown sizes', async () => {
    const selection = createFileSelection({
      multiple: true,
      maxCount: 2,
      maxSize: 100,
      accept: ['image/*', '.pdf'],
    })
    const first = file('photo.png', undefined, 'image/png')
    await selection.select(picker(first))
    const bad = file('notes.txt', 8, 'text/plain')
    await selection.select(picker(bad))
    expect(selection.state.error?.code).toBe('type')
    expect(bad.release).toHaveBeenCalledOnce()
    const second = file()
    const third = file()
    await selection.select(picker(second, third))
    expect(selection.state.error?.code).toBe('count')
    expect(second.release).toHaveBeenCalledOnce()
    expect(third.release).toHaveBeenCalledOnce()
    expect(selection.state.items).toHaveLength(1)
    expect(acceptsFile({ name: 'REPORT.PDF' }, ['.pdf'])).toBe(true)
    selection.dispose()
    expect(() => createFileSelection({ maxCount: 0 })).toThrow()
    expect(() => createFileSelection({ maxSize: Infinity })).toThrow()
    expect(() => createFileSelection({ accept: ['pdf'] })).toThrow()
    expect(() =>
      createFileSelection({
        initial: [
          { id: 'a', name: 'A', status: 'selected' },
          { id: 'a', name: 'B', status: 'selected' },
        ],
      }),
    ).toThrow()
  })

  it('cancels superseded pickers and releases their late results', async () => {
    const pending = deferred<readonly SelectedFile[]>()
    const cancelled = vi.fn()
    const selection = createFileSelection()
    const first = selection.select({
      pick: (_request, token) => {
        token.onCancel(cancelled)
        return pending.promise
      },
    })
    const latest = file('current.pdf')
    await selection.select(picker(latest))
    expect(cancelled).toHaveBeenCalledOnce()
    const stale = file('old.pdf')
    pending.resolve([stale])
    await first
    expect(selection.state.items[0]!.name).toBe('current.pdf')
    expect(stale.release).toHaveBeenCalledOnce()
    selection.dispose()
  })

  it('treats preview failures as optional and ignores preview completion after removal', async () => {
    const selection = createFileSelection({ multiple: true })
    const failed = {
      ...file(),
      preview: vi.fn(async () => {
        throw new Error('No decoder')
      }),
    }
    await selection.select(picker(failed))
    await flush()
    expect(selection.state.items).toHaveLength(1)
    expect(selection.state.error).toBeUndefined()
    const pending = deferred<unknown>()
    const second = { ...file('preview.png'), preview: () => pending.promise }
    await selection.select(picker(second))
    const id = selection.state.items[1]!.id
    await flush()
    selection.remove(id)
    pending.resolve('blob:stale')
    await flush()
    expect(selection.preview(id)).toBeUndefined()
    expect(second.release).toHaveBeenCalledOnce()
    selection.dispose()
  })
})

describe('bounded host upload actions', () => {
  it('supports unknown/known progress, errors and explicit retry on the retained handle', async () => {
    let context!: FileUploadContext
    let transfer = deferred<void>()
    const upload = vi.fn((value: FileUploadContext) => {
      context = value
      return transfer.promise
    })
    const local = file()
    const selection = createFileSelection({ upload })
    await selection.select(picker(local))
    const id = selection.state.items[0]!.id
    const first = selection.upload(id)
    expect(selection.state.items[0]!.status).toBe('uploading')
    expect(selection.state.items[0]!.progress).toBeUndefined()
    context.progress(20, 100)
    expect(selection.state.items[0]!.progress).toBe(0.2)
    context.progress(22)
    expect(selection.state.items[0]!.progress).toBeUndefined()
    transfer.reject(new Error('Try another connection'))
    await first
    expect(selection.state.items[0]).toMatchObject({
      status: 'failed',
      error: 'Try another connection',
    })
    expect(local.release).not.toHaveBeenCalled()
    transfer = deferred<void>()
    const retry = selection.retry(id)
    expect(context.handle).toBe(local.handle)
    context.progress(100, 100)
    expect(selection.state.items[0]!.status).toBe('uploading')
    transfer.resolve()
    await retry
    expect(selection.state.items[0]).toMatchObject({ status: 'uploaded', progress: 1 })
    expect(upload).toHaveBeenCalledTimes(2)
    selection.dispose()
  })

  it('aborts on cancel/remove/replacement and ignores callbacks from old attempts', async () => {
    const attempts: {
      context: FileUploadContext
      gate: ReturnType<typeof deferred<void>>
      abort: ReturnType<typeof vi.fn>
    }[] = []
    const selection = createFileSelection({
      upload: (context) => {
        const attempt = { context, gate: deferred<void>(), abort: vi.fn() }
        context.cancellation.onCancel(attempt.abort)
        attempts.push(attempt)
        return attempt.gate.promise
      },
    })
    await selection.select(picker(file()))
    const id = selection.state.items[0]!.id
    const first = selection.upload(id)
    selection.cancel(id)
    expect(attempts[0]!.abort).toHaveBeenCalledOnce()
    const second = selection.retry(id)
    attempts[0]!.context.progress(99, 100)
    attempts[0]!.gate.resolve()
    await first
    expect(selection.state.items[0]).toMatchObject({ status: 'uploading', progress: undefined })
    selection.remove(id)
    attempts[1]!.gate.reject(new Error('late error'))
    await second
    expect(selection.state.items).toEqual([])
    expect(attempts[1]!.abort).toHaveBeenCalledOnce()
    await selection.select(picker(file()))
    const third = selection.upload(selection.state.items[0]!.id)
    await selection.select(picker(file('replacement.pdf')))
    expect(attempts[2]!.abort).toHaveBeenCalledOnce()
    attempts[2]!.gate.resolve()
    await third
    expect(selection.state.items[0]).toMatchObject({ name: 'replacement.pdf', status: 'selected' })
    selection.dispose()
  })

  it('cancels and releases resources when the Vue owner unmounts', async () => {
    let selection!: FileSelectionController
    let context!: FileUploadContext
    const gate = deferred<void>()
    const app = renderer.createApp(
      defineComponent({
        setup() {
          selection = useFileSelection({
            upload: (value) => {
              context = value
              return gate.promise
            },
          })
          return () => h('section')
        },
      }),
    )
    app.mount(node('root'))
    const local = file()
    await selection.select(picker(local))
    const uploading = selection.upload(selection.state.items[0]!.id)
    app.unmount()
    expect(context.cancellation.cancelled).toBe(true)
    expect(local.release).toHaveBeenCalledOnce()
    gate.resolve()
    await uploading
    expect(selection.hasFile('file-1')).toBe(false)
    const choose = picker(file())
    await selection.select(choose)
    expect(choose.pick).not.toHaveBeenCalled()
  })
})
