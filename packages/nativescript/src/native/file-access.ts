import type { FileHandle } from '@getcortexlabs/mavis-core'

export interface NativeFileReadHandle {
  /** Android java.io.InputStream or an opened iOS NSInputStream. */
  readonly native: unknown
  close(): void
}
export interface NativeFileAccess {
  readonly platform: 'android' | 'ios'
  /** Android content Uri or iOS NSURL. Never a portable filesystem path. */
  readonly native: unknown
  /** Close after use. Removing/disposal also closes streams still owned by this handle. */
  openRead(): NativeFileReadHandle
}

const handles = new WeakMap<FileHandle, NativeFileAccess>()

export function getNativeFile(handle: FileHandle): NativeFileAccess {
  const access = handles.get(handle)
  if (!access) throw new Error('This native file handle is unavailable or has been released')
  return access
}

/** @internal Platform adapters register a resource without exposing it in item metadata. */
export function ownNativeFile(
  platform: NativeFileAccess['platform'],
  native: unknown,
  open: () => { native: unknown; close(): void },
  cleanup: () => void,
) {
  const handle = Object.freeze({}) as FileHandle
  const readers = new Set<NativeFileReadHandle>()
  let released = false
  const access: NativeFileAccess = {
    platform,
    native,
    openRead() {
      if (released) throw new Error('This native file has been released')
      const reader = open()
      let closed = false
      const owned = {
        native: reader.native,
        close() {
          if (closed) return
          closed = true
          readers.delete(owned)
          reader.close()
        },
      }
      readers.add(owned)
      return owned
    },
  }
  handles.set(handle, access)
  return {
    handle,
    release() {
      if (released) return
      released = true
      handles.delete(handle)
      for (const reader of readers) {
        try {
          reader.close()
        } catch {
          /* continue cleanup */
        }
      }
      cleanup()
    },
  }
}
