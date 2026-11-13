import { useStore } from '@builder.io/mitosis'

export default function Budget() {
  const state = useStore({
    parts: [
      { id: 'rent', label: 'Rent', value: 30 },
      { id: 'food', label: 'Food', value: 20, color: '#2F7D6B' },
      { id: 'fun', label: 'Fun', value: 10 },
    ] as DonutSegment[],
    picked: null as string | null,
    locked: false,
    shares: [
      { id: 'alpha', label: 'Alpha', value: 3 },
      { id: 'beta', label: 'Beta', value: 1, color: '#2F7D6B' },
    ] as DonutSegment[],
    grow() {
      state.parts = [
        { id: 'rent', label: 'Rent', value: 30 },
        { id: 'food', label: 'Food', value: 50, color: '#2F7D6B' },
        { id: 'fun', label: 'Fun', value: 10 },
      ]
    },
    lock() {
      state.locked = !state.locked
    },
    swap() {
      state.shares = [
        { id: 'alpha', label: 'Alpha', value: 1 },
        { id: 'beta', label: 'Beta', value: 3, color: '#2F7D6B' },
      ]
    },
    clear() {
      state.shares = []
    },
  })

  return (
    <MColumn id="page" gap="lg">
      <MBox id="ring" width={200} height={444} backgroundColor="#FFF4D6">
        <MColumn>
          <MDonutChart label="Shares" segments={state.shares} size={200} strokeWidth={20} />
        </MColumn>
      </MBox>
      <MRow gap="sm" wrap>
        <MButton text="Swap" onClick={() => state.swap()} />
        <MButton text="Clear" variant="secondary" onClick={() => state.clear()} />
        <MButton text="Grow food" variant="secondary" onClick={() => state.grow()} />
        <MButton text="Lock" variant="secondary" onClick={() => state.lock()} />
      </MRow>
      <MText>{`Picked: ${state.picked ?? 'none'}`}</MText>
      <MDonutChart
        id="budget"
        label="Budget"
        segments={state.parts}
        value={state.picked}
        onChange={(value) => (state.picked = value)}
        disabled={state.locked}
        animateNumber
        totalLabel="All"
        formatValue={(value) => `$${value}`}
      />
    </MColumn>
  )
}
