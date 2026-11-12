import { useRef, useStore } from '@builder.io/mitosis'

export default function Draft() {
  const amountRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    amount: 2 as number | undefined,
    seats: 4 as number | undefined,
    text: '10',
    total: 10 as number | undefined,
    // The source keeps an odd number of seats out.
    seat(next: number | undefined) {
      if (next === undefined) return
      if (next % 2 === 0) state.seats = next
    },
    edit() {
      amountRef.focus()
    },
  })

  return (
    <MColumn gap="md">
      <MNumberInput
        ref={amountRef}
        label="Amount"
        value={state.amount}
        onChange={(value) => (state.amount = value)}
        min={0}
        max={40}
        step={0.5}
      />
      <MText>{`Amount ${state.amount ?? -1}`}</MText>
      <MNumberInput label="Seats" value={state.seats} onChange={(next) => state.seat(next)} />
      <MText>{`Seats ${state.seats ?? -1}`}</MText>
      <MNumberInput
        label="Total"
        value={state.total}
        onChange={(value) => (state.total = value)}
        draft={state.text}
        onDraftChange={(value) => (state.text = value)}
      />
      <MText>{`Total ${state.total ?? -1} typed ${state.text}`}</MText>
      <MButton text="Edit amount" onClick={() => state.edit()} />
    </MColumn>
  )
}
