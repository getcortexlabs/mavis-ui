import { inject, ref, readonly, type InjectionKey } from 'vue'

export interface DirectoryEntry {
  id: string
  name: string
  city: string
}
export interface DirectoryStorage {
  read(): Promise<string | null>
  write(value: string): Promise<void>
}
const seed: DirectoryEntry[] = [
  { id: 'garden', name: 'Community garden', city: 'Porto' },
  { id: 'library', name: 'Open library', city: 'Recife' },
  { id: 'studio', name: 'Neighbourhood studio', city: 'Porto' },
]

/** Create once per app/request. Storage is a host service, never a module singleton. */
export function createDirectory(storage: DirectoryStorage) {
  const entries = ref(seed.map((entry) => ({ ...entry })))
  const query = ref('')
  const storageError = ref('')
  let restoring: Promise<void> | undefined
  let writing = Promise.resolve()
  const restore = () =>
    (restoring ??= (async () => {
      try {
        const value = await storage.read()
        if (value === null) return
        const parsed: unknown = JSON.parse(value)
        if (
          !Array.isArray(parsed) ||
          parsed.length !== seed.length ||
          !seed.every(
            (original) =>
              parsed.filter(
                (entry) =>
                  entry?.id === original.id &&
                  typeof entry.name === 'string' &&
                  entry.name.trim() &&
                  typeof entry.city === 'string',
              ).length === 1,
          )
        )
          throw new Error('Invalid saved directory')
        entries.value = parsed.map(({ id, name, city }) => ({ id, name, city }))
      } catch {
        storageError.value =
          'Saved entries could not be loaded. The sample entries are still available.'
      }
    })())
  return {
    entries: readonly(entries),
    query,
    storageError: readonly(storageError),
    restore,
    async save(id: string, name: string) {
      if (!name.trim() || !entries.value.some((entry) => entry.id === id))
        throw new Error('Invalid entry')
      const pending = writing
        .catch(() => {})
        .then(async () => {
          await restore()
          const next = entries.value.map((entry) =>
            entry.id === id ? { ...entry, name: name.trim() } : { ...entry },
          )
          // Commit state only after the host confirms persistence. A rejected write preserves the draft.
          await storage.write(JSON.stringify(next))
          entries.value = next
        })
      writing = pending
      await pending
    },
  }
}
export type Directory = ReturnType<typeof createDirectory>
export const directoryKey: InjectionKey<Directory> = Symbol('directory')
export function useDirectory() {
  const directory = inject(directoryKey)
  if (!directory) throw new Error('Install the directory service at the application entry.')
  return directory
}
