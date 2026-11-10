import { useStore, Show, For } from '@builder.io/mitosis'
import type { Card } from './types'

export default function Motion() {
  const state = useStore({
    open: false,
    cards: [
      { id: 'a', title: 'Alpha' },
      { id: 'b', title: 'Beta' },
    ] as Card[],
    count: 2,
    toggle() {
      state.open = !state.open
    },
    add() {
      state.count += 1
      state.cards.push({ id: `card${state.count}`, title: `Card ${state.count}` })
    },
    removeFirst() {
      state.cards.splice(0, 1)
    },
    lastToTop() {
      const last = state.cards[state.cards.length - 1]
      if (last === undefined) return
      state.cards.splice(state.cards.length - 1, 1)
      state.cards.unshift(last)
    },
  })
  return (
    <MColumn gap="md">
      <MText variant="title">Motion</MText>
      <MRow gap="sm">
        <MButton text="Toggle details" onClick={() => state.toggle()} />
        <MButton text="Add card" variant="secondary" onClick={() => state.add()} />
        <MButton text="Remove first" variant="secondary" onClick={() => state.removeFirst()} />
        <MButton text="Last to top" variant="secondary" onClick={() => state.lastToTop()} />
      </MRow>
      <Show when={state.open} else={<MText tone="muted">Details are closed</MText>} animate>
        <MText>Details are open</MText>
        <MText tone="muted">{`${state.cards.length} cards`}</MText>
      </Show>
      <MColumn gap="sm">
        <For each={state.cards} animate>
          {(card) => <MText key={card.id}>{card.title}</MText>}
        </For>
      </MColumn>
      <Show when={state.cards.length === 0}>
        <MText tone="muted">No cards</MText>
      </Show>
    </MColumn>
  )
}
