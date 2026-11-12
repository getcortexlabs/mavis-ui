import type { App } from 'vue'
import { createNotes, notesKey, type Note } from './notes'

/** What this fixture's app provides: notes kept in memory, and a store that refuses a third one. */
export function install(app: App) {
  let saved: Note[] | null = null
  app.provide(
    notesKey,
    createNotes({
      async load() {
        return saved === null ? null : saved.map((note) => ({ ...note }))
      },
      async save(notes) {
        if (notes.length === 3) throw new Error('Full')
        saved = notes.map((note) => ({ ...note }))
      },
    }),
  )
}
