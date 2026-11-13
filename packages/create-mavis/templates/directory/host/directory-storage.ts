import {
  directorySeed,
  validDirectoryEntries,
  type DirectoryEntry,
  type DirectorySnapshot,
  type DirectoryStorage,
} from '../shared/directory-store'

export interface DirectoryPersistence {
  read(): Promise<string | null>
  write(value: string): Promise<void>
}

/** Host boundary: JSON and the write queue stay out of the shared screen/store. */
export function createDirectoryStorage(persistence: DirectoryPersistence): DirectoryStorage {
  let entries = directorySeed.map((entry) => ({ ...entry }))
  let revision = 0
  let loadError = false
  let restoring: Promise<void> | undefined
  let writing = Promise.resolve()
  const snapshot = (): DirectorySnapshot => ({
    entries: entries.map((entry) => ({ ...entry })),
    revision,
    loadError,
  })
  const restore = () =>
    (restoring ??= (async () => {
      try {
        const value = await persistence.read()
        if (value === null) return
        const parsed: unknown = JSON.parse(value)
        if (
          !Array.isArray(parsed) ||
          !parsed.every(
            (entry) =>
              entry !== null &&
              typeof entry === 'object' &&
              typeof entry.id === 'string' &&
              typeof entry.name === 'string' &&
              typeof entry.city === 'string',
          ) ||
          !validDirectoryEntries(parsed)
        )
          throw new Error('Invalid saved directory')
        entries = (parsed as DirectoryEntry[]).map(({ id, name, city }) => ({ id, name, city }))
      } catch {
        loadError = true
      }
    })())
  return {
    async load() {
      await restore()
      return snapshot()
    },
    rename(id, name) {
      const operation = writing
        .catch(() => {})
        .then(async () => {
          await restore()
          if (!name.trim() || !entries.some((entry) => entry.id === id))
            throw new Error('Invalid entry')
          const next = entries.map((entry) =>
            entry.id === id ? { ...entry, name: name.trim() } : { ...entry },
          )
          await persistence.write(JSON.stringify(next))
          entries = next
          revision += 1
          return snapshot()
        })
      // A failed write does not poison the queue or change the committed state.
      writing = operation.then(
        () => {},
        () => {},
      )
      return operation
    },
  }
}
