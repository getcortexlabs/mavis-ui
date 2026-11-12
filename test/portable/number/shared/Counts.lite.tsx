import { useStore } from '@builder.io/mitosis'

export default function Counts() {
  const state = useStore({
    quantity: 2 as number | undefined,
    price: 9.5 as number | undefined,
    seats: 4 as number | undefined,
    // The source keeps an odd number of seats out.
    seat(next: number | undefined) {
      if (next === undefined) return
      if (next % 2 === 0) state.seats = next
    },
  })

  return (
    <MColumn gap="md">
      <MBox id="quantity-box">
        <MNumberInput
          id="quantity"
          label="Quantity"
          value={state.quantity}
          onChange={(value) => (state.quantity = value)}
          min={0}
          max={4}
          helperText="Up to four"
        />
      </MBox>
      <MText id="quantity-text">{`Quantity ${state.quantity ?? -1}`}</MText>
      <MButton text="Clear quantity" variant="ghost" onClick={() => (state.quantity = undefined)} />
      <MNumberInput
        label="Price"
        value={state.price}
        onChange={(value) => (state.price = value)}
        step={0.25}
        locale="pt-BR"
        incrementLabel="Aumentar"
        decrementLabel="Diminuir"
      />
      <MText>{`Price ${state.price ?? -1}`}</MText>
      <MNumberInput
        label="Seats"
        value={state.seats}
        onChange={(next) => state.seat(next)}
        step={1}
      />
      <MText>{`Seats ${state.seats ?? -1}`}</MText>
      <MNumberInput
        label="Fixed"
        value={state.seats}
        onChange={(next) => state.seat(next)}
        readonly
      />
    </MColumn>
  )
}
