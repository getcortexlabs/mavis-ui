import { computed, inject, readonly, ref, type InjectionKey } from 'vue'

export type Note = { id: string; title: string; done: boolean }

/** Where notes are kept: each app gives its own. */
export interface NotesStorage {
  load(): Promise<Note[] | null>
  save(notes: Note[]): Promise<void>
}

export function createNotes(storage: NotesStorage) {
  const notes = ref<Note[]>([])
  const status = ref('new')
  const draft = ref('')
  const open = computed(() => notes.value.filter((note) => !note.done).length)

  async function restore() {
    status.value = 'loading'
    try {
      const saved = await storage.load()
      if (saved === null) {
        status.value = 'empty'
        return
      }
      notes.value = saved
      status.value = 'restored'
    } catch {
      status.value = 'unavailable'
    }
  }
  async function persist() {
    try {
      await storage.save(notes.value)
      status.value = 'saved'
    } catch {
      status.value = 'not saved'
    }
  }
  async function add() {
    const title = draft.value.trim()
    if (!title) return
    notes.value.push({ id: `n${notes.value.length + 1}`, title, done: false })
    draft.value = ''
    await persist()
  }
  async function toggle(id: string) {
    notes.value = notes.value.map((note) => (note.id === id ? { ...note, done: !note.done } : note))
    await persist()
  }
  return { notes: readonly(notes), status: readonly(status), draft, open, restore, add, toggle }
}

export type Notes = ReturnType<typeof createNotes>
export const notesKey: InjectionKey<Notes> = Symbol('notes')

export function useNotes() {
  const store = inject(notesKey)
  if (!store) throw new Error('Install the notes store at the application entry.')
  return store
}
