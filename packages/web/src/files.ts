import type { FileHandle, FilePickerAdapter, SelectedFile } from '@getcortexlabs/mavis-core'

const handles = new WeakMap<FileHandle, File>()

/** The host may read/send the File while the selection owns its resource. */
export function getWebFile(handle: FileHandle): File {
  const file = handles.get(handle)
  if (!file) throw new Error('This Web file handle is unavailable or has been released')
  return file
}

function resource(file: File): SelectedFile {
  const handle = Object.freeze({}) as FileHandle
  handles.set(handle, file)
  let source: string | undefined
  let released = false
  return {
    name: file.name,
    size: file.size,
    type: file.type || undefined,
    handle,
    async preview() {
      if (released || !file.type.startsWith('image/')) return
      source ??= URL.createObjectURL(file)
      return source
    },
    release() {
      if (released) return
      released = true
      if (source) URL.revokeObjectURL(source)
      handles.delete(handle)
    },
  }
}

/** Creating the adapter is SSR-safe. The input exists only during user-triggered selection. */
export function createWebFilePicker(): FilePickerAdapter {
  return {
    pick(request, cancellation) {
      if (typeof document === 'undefined')
        return Promise.reject(new Error('File selection requires a mounted browser'))
      if (cancellation.cancelled) return Promise.resolve(null)
      return new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = request.multiple
        input.accept = request.accept.join(',')
        input.tabIndex = -1
        input.setAttribute('aria-hidden', 'true')
        input.style.display = 'none'
        let done = false
        let unsubscribe = () => {}
        const finish = (files: readonly SelectedFile[] | null, error?: unknown) => {
          if (done) return
          done = true
          unsubscribe()
          input.removeEventListener('change', change)
          input.removeEventListener('cancel', cancel)
          input.remove()
          if (error) reject(error)
          else resolve(files)
        }
        const change = () => finish(Array.from(input.files ?? []).map(resource))
        const cancel = () => finish(null)
        input.addEventListener('change', change)
        input.addEventListener('cancel', cancel)
        document.body.append(input)
        unsubscribe = cancellation.onCancel(cancel)
        try {
          input.click()
        } catch (error) {
          finish(null, error)
        }
      })
    },
  }
}
