import { useStore } from '@builder.io/mitosis'
export default function Board() {
  const state = useStore({
    columns: [
      { id: 'todo', title: 'To do' },
      { id: 'done', title: 'Done', limit: 1 },
    ] as KanbanColumn[],
    cards: [
      { id: 'plan', column: 'todo', title: 'Plan', description: 'Map the journey' },
      { id: 'build', column: 'todo', title: 'Build', description: 'Make it real' },
      { id: 'ship', column: 'done', title: 'Ship', disabled: true },
    ] as KanbanCard[],
    last: 'none',
    query: '',
    locked: false,
  })
  return (
    <MColumn gap="md">
      <MKanban
        id="board"
        label="Studio board"
        columns={state.columns}
        value={state.cards}
        onChange={(value) => (state.cards = value)}
        query={state.query}
        disabled={state.locked}
        onMove={(move) =>
          (state.last = `${move.id}: ${move.from} to ${move.to}, before ${move.before ?? 'end'}`)
        }
      />
      <MRow gap="sm">
        <MButton
          text={state.locked ? 'Unlock' : 'Lock'}
          onClick={() => (state.locked = !state.locked)}
        />
        <MButton text="Filter Build" onClick={() => (state.query = 'Build')} />
        <MButton text="Show all" onClick={() => (state.query = '')} />
      </MRow>
      <MText>{`Last: ${state.last}`}</MText>
    </MColumn>
  )
}
