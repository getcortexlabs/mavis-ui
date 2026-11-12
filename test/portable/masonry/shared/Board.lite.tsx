import { useStore } from '@builder.io/mitosis'
import type { Pin } from './types'

export default function Board() {
  const state = useStore({
    pins: [
      { id: 'alder', note: 'tall' },
      { id: 'birch', note: 'short' },
      { id: 'cedar', note: 'short' },
      { id: 'dogwood', note: 'short' },
    ] as Pin[],
    add() {
      state.pins.push({ id: 'elm', note: 'short' })
    },
    clear() {
      state.pins = []
    },
  })

  return (
    <MColumn gap="md">
      <MMasonry
        id="board"
        label="Pinned trees"
        items={state.pins}
        minColumnWidth={120}
        columns={2}
        gap="md"
        emptyLabel="Nothing pinned"
        slotItem={({ item, index }) => (
          <MCard id={`pin-${item.id}`} gap="sm">
            <MText>{item.id}</MText>
            <MBox height={index === 0 ? 96 : 40} />
          </MCard>
        )}
      />
      <MRow gap="sm">
        <MButton text="Add elm" onClick={() => state.add()} />
        <MButton text="Clear" onClick={() => state.clear()} />
      </MRow>
    </MColumn>
  )
}
