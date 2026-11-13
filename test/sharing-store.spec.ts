import { describe, expect, it, vi } from 'vitest'
import {
  createDirectory as createTypedDirectory,
  directorySeed,
} from '../packages/create-mavis/templates/directory/shared/directory-store'
import {
  createDirectoryStorage,
  type DirectoryPersistence,
} from '../packages/create-mavis/templates/directory/host/directory-storage'

// Existing read/write hosts migrate through this adapter; their persisted JSON stays unchanged.
const createDirectory = (persistence: DirectoryPersistence) =>
  createTypedDirectory(createDirectoryStorage(persistence))

describe('shared reference store', () => {
  it('isolates request/app state and preserves the previous value after rejected persistence', async () => {
    const a = createDirectory({
      read: async () => null,
      write: async () => {
        throw new Error('quota')
      },
    })
    let persisted = ''
    const b = createDirectory({
      read: async () => null,
      write: async (value) => {
        persisted = value
      },
    })
    a.query.value = 'Porto'
    await expect(a.save('garden', 'My garden')).rejects.toThrow('quota')
    expect(a.entries.value[0]?.name).toBe('Community garden')
    expect(b.query.value).toBe('')
    await b.save('garden', 'Open garden')
    expect(JSON.parse(persisted)[0].name).toBe('Open garden')
    expect(a.entries.value[0]?.name).toBe('Community garden')
  })
  it('restores once before saving and serializes concurrent edits without losing either update', async () => {
    const seed = [
      { id: 'garden', name: 'Saved garden', city: 'Porto' },
      { id: 'library', name: 'Saved library', city: 'Recife' },
      { id: 'studio', name: 'Saved studio', city: 'Porto' },
    ]
    let release!: (value: string) => void
    const read = new Promise<string>((resolve) => {
      release = resolve
    })
    const writes: string[] = []
    const store = createDirectory({
      read: () => read,
      write: async (value) => {
        writes.push(value)
      },
    })
    const restoring = store.restore()
    const first = store.save('garden', 'New garden'),
      second = store.save('library', 'New library')
    release(JSON.stringify(seed))
    await Promise.all([restoring, first, second])
    const saved = JSON.parse(writes.at(-1)!)
    expect(saved.map((item: { name: string }) => item.name)).toEqual([
      'New garden',
      'New library',
      'Saved studio',
    ])
  })
  it('rejects corrupt storage and exposes a recoverable error without corrupting the seed', async () => {
    const store = createDirectory({ read: async () => '[{"id":"garden"}]', write: async () => {} })
    await store.restore()
    expect(store.storageError.value).toContain('could not be loaded')
    expect(store.entries.value).toHaveLength(3)
    await store.save('garden', 'Recovered garden')
    expect(store.entries.value[0]?.name).toBe('Recovered garden')
  })
  it('keeps the original JSON schema and reads the host once across repeated restores and saves', async () => {
    const read = vi.fn(async () => JSON.stringify(directorySeed))
    const writes: string[] = []
    const store = createDirectory({
      read,
      write: async (value) => {
        writes.push(value)
      },
    })
    await Promise.all([store.restore(), store.restore(), store.save('garden', ' Updated ')])
    await store.restore()
    expect(read).toHaveBeenCalledTimes(1)
    expect(JSON.parse(writes[0]!)).toEqual([
      { id: 'garden', name: 'Updated', city: 'Porto' },
      ...directorySeed.slice(1),
    ])
  })
  it('waits for each write before committing, recovers the queue and retains both successful edits', async () => {
    let fail!: (reason: Error) => void
    let finish!: () => void
    const writes: string[] = []
    const store = createDirectory({
      read: async () => null,
      write: (value) => {
        writes.push(value)
        return writes.length === 1
          ? new Promise<void>((_resolve, reject) => {
              fail = reject
            })
          : new Promise<void>((resolve) => {
              finish = resolve
            })
      },
    })
    const first = store.save('garden', 'Rejected')
    const rejected = expect(first).rejects.toThrow('quota')
    const second = store.save('library', 'Accepted')
    await vi.waitFor(() => expect(writes).toHaveLength(1))
    expect(store.entries.value[0]?.name).toBe('Community garden')
    fail(new Error('quota'))
    await rejected
    await vi.waitFor(() => expect(writes).toHaveLength(2))
    expect(store.entries.value[1]?.name).toBe('Open library')
    finish()
    await second
    expect(store.entries.value.map((entry) => entry.name)).toEqual([
      'Community garden',
      'Accepted',
      'Neighbourhood studio',
    ])
  })
  it('does not allow a delayed load or older save to replace a newer confirmed revision', async () => {
    type Snapshot = { entries: typeof directorySeed; revision: number; loadError: boolean }
    let load!: (value: Snapshot) => void
    let older!: (value: Snapshot) => void
    const store = createTypedDirectory({
      load: () =>
        new Promise((resolve) => {
          load = resolve
        }),
      rename: (id) =>
        id === 'garden'
          ? new Promise((resolve) => {
              older = resolve
            })
          : Promise.resolve({
              entries: directorySeed.map((entry) => ({ ...entry, name: `New ${entry.id}` })),
              revision: 2,
              loadError: false,
            }),
    })
    const restoring = store.restore()
    const first = store.save('garden', 'First')
    await store.save('library', 'Second')
    older({ entries: directorySeed, revision: 1, loadError: false })
    load({ entries: directorySeed, revision: 0, loadError: false })
    await Promise.all([restoring, first])
    expect(store.entries.value.map((entry) => entry.name)).toEqual([
      'New garden',
      'New library',
      'New studio',
    ])
  })
})
