import { useStore } from '@builder.io/mitosis'
export default function Ideas() {
  const state = useStore({
    cards: [
      { id: 'garden', title: 'Moon garden', description: 'A quiet place' },
      { id: 'cabin', title: 'Forest cabin', description: 'Among the trees' },
    ] as SwipeCard[],
    current: 'garden' as string | null,
    previous: null as string | null,
    last: 'none',
    locked: false,
  })
  return (
    <MColumn gap="md">
      <MSwipeDeck
        id="ideas"
        label="Weekend ideas"
        items={state.cards}
        value={state.current}
        onChange={(value) => (state.current = value)}
        disabled={state.locked}
        canUndo={state.previous !== null}
        onDecide={(event) => {
          state.previous = event.item.id
          state.last = `${event.item.title}: ${event.decision}`
        }}
        onUndo={() => {
          state.current = state.previous
          state.previous = null
        }}
      />
      <MButton
        text={state.locked ? 'Unlock' : 'Lock'}
        onClick={() => (state.locked = !state.locked)}
      />
      <MText>{`Decision: ${state.last}`}</MText>
    </MColumn>
  )
}
