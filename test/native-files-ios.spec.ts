import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFileSelection } from '../packages/core/src/files.js'
import { getNativeFile } from '../packages/nativescript/src/native/file-access.js'

const host = vi.hoisted(() => ({
  present: vi.fn(),
  remove: vi.fn(),
  stream: { open: vi.fn(), close: vi.fn() },
  thumbnail: vi.fn(),
}))
vi.mock('@nativescript/core', () => ({
  Application: {
    ios: { rootController: { presentViewControllerAnimatedCompletion: host.present } },
  },
  ImageSource: class {
    constructor(readonly native: unknown) {}
  },
}))
import { createNativeFilePicker } from '../packages/nativescript/src/native/file-picker.ios.js'

class Picker {
  delegate?: {
    documentPickerWasCancelled(): void
    documentPickerDidPickDocumentsAtURLs(picker: Picker, urls: unknown): void
  }
  presentationController: { delegate?: object } = {}
  allowsMultipleSelection = false
  dismissViewControllerAnimatedCompletion = vi.fn()
}
let picker: Picker
let imported: unknown[]
beforeEach(() => {
  vi.clearAllMocks()
  picker = new Picker()
  imported = []
  vi.stubGlobal('NSObject', {
    extend: (members: object) => {
      class Delegate {}
      Object.assign(Delegate.prototype, members)
      return Delegate
    },
  })
  vi.stubGlobal('UIDocumentPickerDelegate', {})
  vi.stubGlobal('UIAdaptivePresentationControllerDelegate', {})
  vi.stubGlobal('UIDocumentPickerViewController', {
    alloc: () => ({
      initForOpeningContentTypesAsCopy: (...args: unknown[]) => {
        imported = args
        return picker
      },
    }),
  })
  const type = { identifier: 'com.adobe.pdf', preferredMIMEType: 'application/pdf' }
  vi.stubGlobal('UTType', {
    typeWithFilenameExtension: () => type,
    typeWithMIMEType: () => type,
    typeWithIdentifier: (identifier: string) => ({ identifier }),
  })
  vi.stubGlobal('NSFileManager', {
    defaultManager: {
      attributesOfItemAtPathError: () => ({ objectForKey: () => 32 }),
      removeItemAtURLError: host.remove,
    },
  })
  vi.stubGlobal('NSInputStream', { inputStreamWithURL: () => host.stream })
  vi.stubGlobal('QLThumbnailGenerationRequest', {
    alloc: () => ({ initWithFileAtURLSizeScaleRepresentationTypes: () => ({}) }),
  })
  vi.stubGlobal('QLThumbnailGenerator', {
    sharedGenerator: {
      generateBestRepresentationForRequestCompletionHandler: (
        _request: unknown,
        callback: (image: unknown, error: unknown) => void,
      ) => callback({ UIImage: 'thumbnail' }, null),
      cancelRequest: host.thumbnail,
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('iOS document import adapter', () => {
  it('imports a private copy, retains the delegate, exposes a stream and deletes only its copy on release', async () => {
    let uploadedHandle: Parameters<typeof getNativeFile>[0] | undefined
    const selection = createFileSelection({
      accept: ['.pdf'],
      upload: async ({ handle }) => {
        uploadedHandle = handle
      },
    })
    const pending = selection.select(createNativeFilePicker())
    expect(imported[1]).toBe(true)
    expect(host.present).toHaveBeenCalledWith(picker, true, null)
    expect(picker.delegate).toBeTruthy()
    const url = {
      path: '/app/tmp/import/receipt.pdf',
      lastPathComponent: 'receipt.pdf',
      pathExtension: 'pdf',
    }
    picker.delegate!.documentPickerDidPickDocumentsAtURLs(picker, {
      count: 1,
      objectAtIndex: () => url,
    })
    await pending
    expect(picker.delegate).toBeNull()
    expect(JSON.stringify(selection.state)).not.toContain('/app/tmp')
    const id = selection.state.items[0]!.id
    await selection.upload(id)
    const access = getNativeFile(uploadedHandle!)
    expect(access.platform).toBe('ios')
    expect(access.native).toBe(url)
    const stream = access.openRead()
    expect(host.stream.open).toHaveBeenCalledOnce()
    selection.dispose()
    expect(host.stream.close).toHaveBeenCalledOnce()
    expect(host.remove).toHaveBeenCalledWith(url)
    stream.close()
    expect(host.remove).toHaveBeenCalledOnce()
    expect(() => getNativeFile(uploadedHandle!)).toThrow('released')
  })

  it('handles user cancellation and owner cancellation without presenting another picker', async () => {
    const selection = createFileSelection()
    const first = selection.select(createNativeFilePicker())
    picker.delegate!.documentPickerWasCancelled()
    await first
    expect(selection.state.picking).toBe(false)
    const second = selection.select(createNativeFilePicker())
    selection.cancelSelection()
    await second
    expect(picker.dismissViewControllerAnimatedCompletion).toHaveBeenCalledOnce()
    expect(picker.delegate).toBeNull()
    expect(host.remove).not.toHaveBeenCalled()
    expect(selection.state.items).toEqual([])
  })
})
