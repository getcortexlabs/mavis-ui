import { For, useStore } from '@builder.io/mitosis'
import { useNotes } from './notes'

export default function Notes() {
  const store = useNotes()
  const state = useStore({
    get summary(): string {
      return `${store.open.value} open of ${store.notes.value.length}`
    },
  })

  return (
    <MColumn gap="md">
      <MText variant="title">{state.summary}</MText>
      <MText>Status: {store.status.value}</MText>
      <MInput
        label="New note"
        value={store.draft.value}
        onChange={(value) => (store.draft.value = value)}
      />
      <MRow gap="sm" wrap>
        <MButton onClick={() => store.add()} text="Add" />
        <MButton onClick={() => store.restore()} text="Restore" />
        <MButton onClick={() => (store.draft.value = 'Buy bread')} text="Suggest" />
      </MRow>
      <For each={store.notes.value}>
        {(note) => (
          <MButton
            key={note.id}
            onClick={() => store.toggle(note.id)}
            text={`${note.done ? 'Done' : 'Open'} ${note.id}: ${note.title}`}
          />
        )}
      </For>
    </MColumn>
  )
}
