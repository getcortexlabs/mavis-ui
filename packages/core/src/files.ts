/** Serializable metadata only. Local handles and previews never enter this descriptor. */
export interface FileItem {
  readonly id: string
  readonly name: string
  readonly size?: number
  readonly type?: string
  readonly status: 'selected' | 'uploading' | 'uploaded' | 'failed' | 'cancelled'
  /** A fraction from zero to one; absent means the total is unknown. */
  readonly progress?: number
  readonly error?: string
}

/** Platform-owned, session-only identity. Use a platform accessor inside host transport. */
export interface FileHandle {
  readonly __mavisFileHandle: never
}

export interface FileCancellation {
  readonly cancelled: boolean
  onCancel(callback: () => void): () => void
}

export interface SelectedFile {
  readonly name: string
  readonly size?: number
  readonly type?: string
  readonly handle: FileHandle
  /** Renderer-specific image source, owned by this resource. Failure keeps the file. */
  preview?(): Promise<unknown>
  release(): void
}

export interface FileSelectionRequest {
  readonly multiple: boolean
  readonly accept: readonly string[]
}

export interface FilePickerAdapter {
  /** Must be called directly from user activation, before any asynchronous work. */
  pick(
    request: FileSelectionRequest,
    cancellation: FileCancellation,
  ): Promise<readonly SelectedFile[] | null>
}

export interface FileUploadContext {
  readonly item: FileItem
  readonly handle: FileHandle
  readonly cancellation: FileCancellation
  /** Omit total when unknown; a reported fraction never completes an upload. */
  progress(loaded: number, total?: number): void
}
export type FileUpload = (context: FileUploadContext) => Promise<void>

export interface FileSelectionOptions {
  /** Metadata from the host, including SSR. Initial entries have no local resource. */
  initial?: readonly FileItem[]
  multiple?: boolean
  /** Extensions (.pdf), exact MIME types, or MIME families (image/*). */
  accept?: readonly string[]
  maxCount?: number
  /** Per-file limit in bytes. Unknown sizes cannot be checked locally. */
  maxSize?: number
  upload?: FileUpload
}

export type FileSelectionErrorCode = 'picker' | 'type' | 'size' | 'count'
export interface FileSelectionState {
  readonly items: readonly FileItem[]
  readonly picking: boolean
  readonly error?: { readonly code: FileSelectionErrorCode; readonly message: string }
}

export interface FileSelectionController {
  readonly state: FileSelectionState
  readonly canUpload: boolean
  subscribe(listener: (state: FileSelectionState) => void): () => void
  select(picker: FilePickerAdapter): Promise<void>
  cancelSelection(): void
  hasFile(id: string): boolean
  preview(id: string): unknown
  discardPreview(id: string): void
  upload(id: string): Promise<void>
  retry(id: string): Promise<void>
  cancel(id: string): void
  remove(id: string): void
  clear(): void
  /** Cancels active operations, retaining selected files for an explicit retry. */
  pause(): void
  /** Idempotent. Cancels work and releases every locally owned resource. */
  dispose(): void
}

function cancellation() {
  let cancelled = false
  const callbacks = new Set<() => void>()
  const token: FileCancellation = {
    get cancelled() {
      return cancelled
    },
    onCancel(callback) {
      if (cancelled) callback()
      else callbacks.add(callback)
      return () => {
        callbacks.delete(callback)
      }
    },
  }
  return {
    token,
    cancel() {
      if (cancelled) return
      cancelled = true
      const pending = [...callbacks]
      callbacks.clear()
      for (const callback of pending) {
        // A broken host abort callback must not retain the other resources.
        try {
          callback()
        } catch {
          /* cancellation remains authoritative */
        }
      }
    },
  }
}

function release(file: SelectedFile) {
  try {
    file.release()
  } catch {
    /* release the remaining resources as well */
  }
}

export function acceptsFile(file: Pick<FileItem, 'name' | 'type'>, accept: readonly string[]) {
  if (!accept.length) return true
  const name = file.name.toLowerCase()
  const type = file.type?.toLowerCase()
  return accept.some((hint) => {
    const value = hint.toLowerCase()
    if (value.startsWith('.')) return name.endsWith(value)
    if (value.endsWith('/*')) return Boolean(type?.startsWith(value.slice(0, -1)))
    return type === value
  })
}

/** Pure controller: no DOM, native APIs, timers, request globals, or automatic transfers. */
export function createFileSelection(options: FileSelectionOptions = {}): FileSelectionController {
  const multiple = options.multiple ?? false
  const accept = Object.freeze([...(options.accept ?? [])])
  const maxCount = options.maxCount ?? (multiple ? 10 : 1)
  const maxSize = options.maxSize
  if (!Number.isInteger(maxCount) || maxCount < 1)
    throw new RangeError('File maxCount must be a positive integer')
  if (maxSize !== undefined && (!Number.isFinite(maxSize) || maxSize < 0))
    throw new RangeError('File maxSize must be finite and nonnegative')
  if (accept.some((value) => !/^(\.[\w.-]+|[\w!#$&^.+-]+\/(?:[\w!#$&^.+-]+|\*))$/.test(value)))
    throw new TypeError('File accept must contain extensions or MIME types')
  let nextId = 0
  let disposed = false
  let picking: ReturnType<typeof cancellation> | undefined
  const listeners = new Set<(state: FileSelectionState) => void>()
  const resources = new Map<string, SelectedFile>()
  const previews = new Map<string, unknown>()
  const operations = new Map<string, ReturnType<typeof cancellation>>()
  const ids = new Set<string>()
  const initial = (options.initial ?? []).map((item) => {
    if (!item.id || ids.has(item.id) || !item.name.trim())
      throw new TypeError('File descriptors need unique IDs and readable names')
    if (item.size !== undefined && (!Number.isFinite(item.size) || item.size < 0))
      throw new RangeError('File size must be finite and nonnegative')
    if (!['selected', 'uploading', 'uploaded', 'failed', 'cancelled'].includes(item.status))
      throw new TypeError('Invalid file status')
    if (
      item.progress !== undefined &&
      (!Number.isFinite(item.progress) || item.progress < 0 || item.progress > 1)
    )
      throw new RangeError('File progress must be between zero and one')
    ids.add(item.id)
    // Copy only portable fields; do not retain extra properties from a host object.
    return Object.freeze({
      id: item.id,
      name: item.name,
      size: item.size,
      type: item.type,
      status: item.status,
      progress: item.progress,
      error: item.error,
    })
  })
  if (initial.length > (multiple ? maxCount : 1))
    throw new RangeError('Initial files exceed the selection count')
  let state: FileSelectionState = Object.freeze({ items: Object.freeze(initial), picking: false })

  function publish(patch: Partial<FileSelectionState> = {}) {
    if (disposed) return
    state = Object.freeze({ ...state, ...patch })
    for (const listener of [...listeners]) listener(state)
  }
  function update(id: string, patch: Partial<FileItem>) {
    publish({
      items: Object.freeze(
        state.items.map((item) => (item.id === id ? Object.freeze({ ...item, ...patch }) : item)),
      ),
    })
  }
  function cancel(id: string) {
    const operation = operations.get(id)
    if (!operation) return
    operations.delete(id)
    operation.cancel()
    update(id, { status: 'cancelled', progress: undefined, error: undefined })
  }
  function forget(id: string) {
    cancel(id)
    const file = resources.get(id)
    resources.delete(id)
    previews.delete(id)
    if (file) release(file)
  }
  function cancelSelection() {
    const previous = picking
    picking = undefined
    previous?.cancel()
    if (previous) publish({ picking: false })
  }
  async function upload(id: string) {
    const file = resources.get(id)
    const item = state.items.find((entry) => entry.id === id)
    if (
      disposed ||
      !file ||
      !item ||
      !options.upload ||
      operations.has(id) ||
      item.status === 'uploaded'
    )
      return
    const operation = cancellation()
    operations.set(id, operation)
    const current = () =>
      !disposed && operations.get(id) === operation && resources.get(id) === file
    update(id, { status: 'uploading', progress: undefined, error: undefined })
    try {
      await options.upload({
        item,
        handle: file.handle,
        cancellation: operation.token,
        progress(loaded, total) {
          if (!current()) return
          if (
            !Number.isFinite(loaded) ||
            loaded < 0 ||
            (total !== undefined && (!Number.isFinite(total) || total <= 0))
          )
            throw new RangeError(
              'Upload progress needs nonnegative loaded bytes and a positive total',
            )
          update(id, { progress: total === undefined ? undefined : Math.min(1, loaded / total) })
        },
      })
      if (current()) update(id, { status: 'uploaded', progress: 1, error: undefined })
    } catch (error) {
      if (current())
        update(id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed',
        })
    } finally {
      if (operations.get(id) === operation) operations.delete(id)
    }
  }
  const controller: FileSelectionController = {
    get state() {
      return state
    },
    get canUpload() {
      return Boolean(options.upload)
    },
    subscribe(listener) {
      if (!disposed) listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    async select(picker) {
      if (disposed) return
      cancelSelection()
      const operation = cancellation()
      picking = operation
      publish({ picking: true, error: undefined })
      let files: readonly SelectedFile[] | null = null
      let retained = false
      try {
        // Keep the actual picker launch in the same user activation stack.
        files = await picker.pick({ multiple, accept }, operation.token)
        if (disposed || picking !== operation || operation.token.cancelled || !files?.length) return
        const count = multiple ? state.items.length + files.length : files.length
        let error: FileSelectionState['error']
        if (count > (multiple ? maxCount : 1))
          error = { code: 'count', message: `Choose at most ${multiple ? maxCount : 1} files` }
        else if (files.some((file) => !file.name.trim() || !acceptsFile(file, accept)))
          error = { code: 'type', message: 'This file type is not accepted' }
        else if (
          files.some(
            (file) =>
              file.size !== undefined &&
              (!Number.isFinite(file.size) ||
                file.size < 0 ||
                (maxSize !== undefined && file.size > maxSize)),
          )
        )
          error = { code: 'size', message: 'A file exceeds the size limit' }
        if (error) {
          publish({ error })
          return
        }
        if (!multiple) for (const item of state.items) forget(item.id)
        const additions = files.map((file) => {
          let id: string
          do {
            id = `file-${++nextId}`
          } while (ids.has(id))
          ids.add(id)
          resources.set(id, file)
          return Object.freeze({
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'selected' as const,
          })
        })
        retained = true
        publish({ items: Object.freeze(multiple ? [...state.items, ...additions] : additions) })
        for (const item of additions) {
          const file = resources.get(item.id)!
          if (file.preview)
            void Promise.resolve()
              .then(() =>
                !disposed && resources.get(item.id) === file ? file.preview!() : undefined,
              )
              .then((preview) => {
                if (!disposed && resources.get(item.id) === file && preview != null) {
                  previews.set(item.id, preview)
                  publish()
                }
              })
              .catch(() => {
                /* Preview failure never rejects an otherwise usable file. */
              })
        }
      } catch (error) {
        if (!disposed && picking === operation && !operation.token.cancelled)
          publish({
            error: {
              code: 'picker',
              message: error instanceof Error ? error.message : 'Unable to select files',
            },
          })
      } finally {
        if (!retained && files) for (const file of files) release(file)
        if (picking === operation) {
          picking = undefined
          publish({ picking: false })
        }
      }
    },
    cancelSelection,
    hasFile: (id) => resources.has(id),
    preview: (id) => previews.get(id),
    discardPreview(id) {
      if (previews.delete(id)) publish()
    },
    upload,
    retry: upload,
    cancel,
    remove(id) {
      if (disposed) return
      forget(id)
      publish({
        items: Object.freeze(state.items.filter((item) => item.id !== id)),
        error: undefined,
      })
    },
    clear() {
      cancelSelection()
      for (const item of state.items) forget(item.id)
      publish({ items: Object.freeze([]), error: undefined })
    },
    pause() {
      cancelSelection()
      for (const id of [...operations.keys()]) cancel(id)
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancelSelection()
      for (const id of [...operations.keys()]) cancel(id)
      for (const file of resources.values()) release(file)
      resources.clear()
      previews.clear()
      listeners.clear()
    },
  }
  return Object.freeze(controller)
}
