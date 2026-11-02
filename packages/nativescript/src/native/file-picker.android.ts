import { Application, ImageSource } from '@nativescript/core'
import { SDK_VERSION } from '@nativescript/core/utils/constants'
import type { FilePickerAdapter, SelectedFile } from '@getcortexlabs/mavis-core'
import { ownNativeFile } from './file-access.js'

interface Uri {
  toString(): string
  getLastPathSegment(): string
}
interface Stream {
  close(): void
}
interface Cursor {
  moveToFirst(): boolean
  getColumnIndex(name: string): number
  isNull(index: number): boolean
  getString(index: number): string
  getLong(index: number): number
  close(): void
}
interface Resolver {
  getType(uri: Uri): string | null
  query(uri: Uri, projection: null, selection: null, args: null, order: null): Cursor | null
  openInputStream(uri: Uri): Stream | null
  loadThumbnail(uri: Uri, size: unknown, cancellation: null): unknown
}
interface Intent {
  addCategory(value: string): Intent
  setType(type: string): Intent
  putExtra(name: string, value: unknown): Intent
  addFlags(flags: number): Intent
  getData(): Uri | null
  getClipData(): { getItemCount(): number; getItemAt(index: number): { getUri(): Uri } } | null
}
declare const android: {
  content: {
    Intent: {
      new (action: string): Intent
      ACTION_OPEN_DOCUMENT: string
      CATEGORY_OPENABLE: string
      EXTRA_ALLOW_MULTIPLE: string
      EXTRA_MIME_TYPES: string
      FLAG_GRANT_READ_URI_PERMISSION: number
    }
  }
  util: { Size: new (width: number, height: number) => unknown }
  webkit: {
    MimeTypeMap: { getSingleton(): { getMimeTypeFromExtension(extension: string): string | null } }
  }
}

// One active system picker per adapter; unique codes prevent cross-delivery between owners.
let requestSequence = 0x4d00
export function createNativeFilePicker(): FilePickerAdapter {
  return {
    pick(request, cancellation) {
      if (cancellation.cancelled) return Promise.resolve(null)
      const app = Application.android
      const activity = app.foregroundActivity ?? app.startActivity
      if (!activity)
        return Promise.reject(new Error('File selection requires a foreground Activity'))
      const resolver = activity.getContentResolver() as Resolver
      const requestCode = requestSequence++
      if (requestSequence > 0x5d00) requestSequence = 0x4d00
      return new Promise((resolve, reject) => {
        let done = false
        let unsubscribe = () => {}
        function finish(files: readonly SelectedFile[] | null, error?: unknown) {
          if (done) {
            for (const file of files ?? []) file.release()
            return
          }
          done = true
          unsubscribe()
          app.off('activityResult', result)
          if (error) reject(error)
          else resolve(files)
        }
        function result(event: { requestCode: number; resultCode: number; intent?: Intent }) {
          if (event.requestCode !== requestCode) return
          if (event.resultCode !== -1 || !event.intent) {
            finish(null)
            return
          }
          const files: SelectedFile[] = []
          try {
            const uris: Uri[] = []
            const clip = event.intent.getClipData()
            if (clip)
              for (let index = 0; index < clip.getItemCount(); index++)
                uris.push(clip.getItemAt(index).getUri())
            else {
              const uri = event.intent.getData()
              if (uri) uris.push(uri)
            }
            const unique = new Set<string>()
            for (const uri of uris) {
              if (unique.has(uri.toString())) continue
              unique.add(uri.toString())
              let name = uri.getLastPathSegment()?.split('/').at(-1) || 'Document'
              let size: number | undefined
              const cursor = resolver.query(uri, null, null, null, null)
              try {
                if (cursor?.moveToFirst()) {
                  const nameColumn = cursor.getColumnIndex('_display_name')
                  const sizeColumn = cursor.getColumnIndex('_size')
                  if (nameColumn >= 0 && !cursor.isNull(nameColumn))
                    name = cursor.getString(nameColumn)
                  if (sizeColumn >= 0 && !cursor.isNull(sizeColumn))
                    size = Number(cursor.getLong(sizeColumn))
                }
              } finally {
                cursor?.close()
              }
              let released = false
              const owner = ownNativeFile(
                'android',
                uri,
                () => {
                  const stream = resolver.openInputStream(uri)
                  if (!stream) throw new Error('The document provider did not open this file')
                  return { native: stream, close: () => stream.close() }
                },
                () => {
                  released = true
                },
              )
              files.push({
                name,
                size,
                type: resolver.getType(uri) ?? undefined,
                ...owner,
                async preview() {
                  if (released || SDK_VERSION < 29) return
                  // The provider creates a bounded thumbnail; failures retain the file.
                  const bitmap = resolver.loadThumbnail(uri, new android.util.Size(160, 160), null)
                  if (released || !bitmap) return
                  return new ImageSource(bitmap)
                },
              })
            }
            finish(files)
          } catch (error) {
            for (const file of files) file.release()
            finish(null, error)
          }
        }
        app.on('activityResult', result)
        unsubscribe = cancellation.onCancel(() => {
          // finishActivity only dismisses the child Activity launched by this request.
          try {
            activity.finishActivity(requestCode)
          } finally {
            finish(null)
          }
        })
        try {
          const intent = new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT)
          intent.addCategory(android.content.Intent.CATEGORY_OPENABLE)
          const hints = request.accept.map((hint) =>
            hint.startsWith('.')
              ? android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(
                  hint.slice(1).toLowerCase(),
                )
              : hint,
          )
          const types = hints.filter((hint): hint is string => Boolean(hint))
          // Unknown extensions widen the platform hint; core checks names after selection.
          intent.setType(types.length === 1 && types.length === hints.length ? types[0]! : '*/*')
          if (types.length > 1 && types.length === hints.length) {
            // A JS array selects the Bundle overload in the NativeScript bridge.
            const nativeTypes = (
              Array as ArrayConstructor & {
                create(type: string, length: number): string[]
              }
            ).create('java.lang.String', types.length)
            types.forEach((type, index) => {
              nativeTypes[index] = type
            })
            intent.putExtra(android.content.Intent.EXTRA_MIME_TYPES, nativeTypes)
          }
          intent.putExtra(android.content.Intent.EXTRA_ALLOW_MULTIPLE, request.multiple)
          intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
          activity.startActivityForResult(intent, requestCode)
        } catch (error) {
          finish(null, error)
        }
      })
    },
  }
}
