import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFileSelection } from '../packages/core/src/files.js'
import { getNativeFile } from '../packages/nativescript/src/native/file-access.js'

const host = vi.hoisted(() => {
  const listeners = new Map<string, (event: unknown) => void>()
  const cursor = {
    moveToFirst: () => true,
    getColumnIndex: (name: string) => (name === '_display_name' ? 0 : 1),
    isNull: () => false,
    getString: () => 'native.pdf',
    getLong: () => 40,
    close: vi.fn(),
  }
  const stream = { close: vi.fn() }
  const resolver = {
    getType: () => 'application/pdf',
    query: () => cursor,
    openInputStream: () => stream,
    loadThumbnail: vi.fn(() => ({ preview: true })),
  }
  const activity = {
    getContentResolver: () => resolver,
    startActivityForResult: vi.fn(),
    finishActivity: vi.fn(),
  }
  const app = {
    foregroundActivity: activity,
    startActivity: activity,
    on: (event: string, callback: (event: unknown) => void) => listeners.set(event, callback),
    off: (event: string) => listeners.delete(event),
  }
  return { listeners, cursor, stream, resolver, activity, app }
})
vi.mock('@nativescript/core', () => ({
  Application: { android: host.app },
  ImageSource: class {
    constructor(readonly native: unknown) {}
  },
}))
vi.mock('@nativescript/core/utils/constants', () => ({ SDK_VERSION: 36 }))
import { createNativeFilePicker } from '../packages/nativescript/src/native/file-picker.android.js'

class Intent {
  static ACTION_OPEN_DOCUMENT = 'android.intent.action.OPEN_DOCUMENT'
  static CATEGORY_OPENABLE = 'android.intent.category.OPENABLE'
  static EXTRA_ALLOW_MULTIPLE = 'multiple'
  static EXTRA_MIME_TYPES = 'mimeTypes'
  static FLAG_GRANT_READ_URI_PERMISSION = 1
  category = ''
  type = ''
  flags = 0
  extras: Record<string, unknown> = {}
  constructor(readonly action: string) {}
  addCategory(value: string) {
    this.category = value
    return this
  }
  setType(value: string) {
    this.type = value
    return this
  }
  putExtra(key: string, value: unknown) {
    this.extras[key] = value
    return this
  }
  addFlags(value: number) {
    this.flags |= value
    return this
  }
}
beforeEach(() => {
  host.listeners.clear()
  vi.clearAllMocks()
  vi.stubGlobal('android', {
    content: { Intent },
    util: { Size: class {} },
    webkit: {
      MimeTypeMap: { getSingleton: () => ({ getMimeTypeFromExtension: () => 'application/pdf' }) },
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('Android document selection adapter', () => {
  it('uses ACTION_OPEN_DOCUMENT without broad grants, exposes a lifetime-bound stream and closes resources', async () => {
    let uploadedHandle: Parameters<typeof getNativeFile>[0] | undefined
    const selection = createFileSelection({
      accept: ['.pdf'],
      upload: async ({ handle }) => {
        uploadedHandle = handle
      },
    })
    const pending = selection.select(createNativeFilePicker())
    const [intent, code] = host.activity.startActivityForResult.mock.calls[0] as unknown as [
      Intent,
      number,
    ]
    expect(intent.action).toBe(Intent.ACTION_OPEN_DOCUMENT)
    expect(intent.category).toBe(Intent.CATEGORY_OPENABLE)
    expect(intent.type).toBe('application/pdf')
    expect(intent.flags).toBe(1)
    const uri = {
      toString: () => 'content://provider/receipt',
      getLastPathSegment: () => 'receipt',
    }
    host.listeners.get('activityResult')!({
      requestCode: code,
      resultCode: -1,
      intent: { getClipData: () => null, getData: () => uri },
    })
    await pending
    expect(host.cursor.close).toHaveBeenCalledOnce()
    expect(host.listeners.size).toBe(0)
    const id = selection.state.items[0]!.id
    await selection.upload(id)
    const access = getNativeFile(uploadedHandle!)
    expect(access.platform).toBe('android')
    expect(access.native).toBe(uri)
    const read = access.openRead()
    expect(read.native).toBe(host.stream)
    selection.remove(id)
    expect(host.stream.close).toHaveBeenCalledOnce()
    read.close()
    expect(host.stream.close).toHaveBeenCalledOnce()
    expect(() => access.openRead()).toThrow('released')
    expect(() => getNativeFile(uploadedHandle!)).toThrow('released')
  })

  it('ignores unrelated activity results and cancels only its launched picker', async () => {
    const selection = createFileSelection()
    const pending = selection.select(createNativeFilePicker())
    const code = host.activity.startActivityForResult.mock.calls[0]![1]
    host.listeners.get('activityResult')!({ requestCode: 1, resultCode: 0 })
    expect(selection.state.picking).toBe(true)
    selection.cancelSelection()
    await pending
    expect(host.activity.finishActivity).toHaveBeenCalledWith(code)
    expect(host.listeners.size).toBe(0)
    expect(selection.state.items).toEqual([])
  })
})
