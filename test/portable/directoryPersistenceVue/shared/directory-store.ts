import { inject, ref, readonly, type InjectionKey } from 'vue'

export interface DirectoryEntry {
  id: string
  name: string
  city: string
}
export interface DirectoryStorage {
  load(): Promise<DirectorySnapshot>
  rename(id: string, name: string): Promise<DirectorySnapshot>
}
export interface DirectorySnapshot {
  entries: DirectoryEntry[]
  revision: number
  loadError: boolean
}
export const directorySeed: DirectoryEntry[] = [
  { id: 'garden', name: 'Community garden', city: 'Porto' },
  { id: 'library', name: 'Open library', city: 'Recife' },
  { id: 'studio', name: 'Neighbourhood studio', city: 'Porto' },
]

/** JSON decoding belongs to the host; the accepted directory records are the same everywhere. */
export function validDirectoryEntries(entries: DirectoryEntry[]): boolean {
  return (
    entries.length === directorySeed.length &&
    entries.every((entry) => entry.name.trim() !== '') &&
    directorySeed.every(
      (original) => entries.filter((entry) => entry.id === original.id).length === 1,
    )
  )
}

/** Create once per app/request. Storage is a host service, never a module singleton. */
export function createDirectory(storage: DirectoryStorage) {
  const entries = ref<DirectoryEntry[]>(directorySeed.map((entry) => ({ ...entry })))
  const query = ref('')
  const storageError = ref('')
  let revision = -1
  function accept(snapshot: DirectorySnapshot) {
    // A delayed load or save must not undo a newer confirmed write.
    if (snapshot.revision < revision) return
    revision = snapshot.revision
    entries.value = snapshot.entries.map((entry) => ({ ...entry }))
    if (snapshot.loadError)
      storageError.value =
        'Saved entries could not be loaded. The sample entries are still available.'
  }
  async function restore() {
    try {
      const snapshot = await storage.load()
      accept(snapshot)
    } catch {
      storageError.value =
        'Saved entries could not be loaded. The sample entries are still available.'
    }
  }
  return {
    entries: readonly(entries),
    query,
    storageError: readonly(storageError),
    restore,
    async save(id: string, name: string) {
      if (!name.trim() || !entries.value.some((entry) => entry.id === id))
        throw new Error('Invalid entry')
      // The host performs an atomic edit against its latest persisted value, not a stale snapshot.
      const snapshot = await storage.rename(id, name.trim())
      accept(snapshot)
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
