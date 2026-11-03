import { describe, expect, it } from 'vitest'
import { createDirectory } from '../packages/create-mavis/templates/directory/shared/directory-store'

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
})
