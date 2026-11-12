import { useStore } from '@builder.io/mitosis'

export default function Ranges() {
  const state = useStore({
    price: [20, 80] as [number, number],
    hours: [9, 17] as [number, number],
    level: [2, 3] as [number, number],
    // The source keeps the day from starting before 8.
    plan(next: [number, number]) {
      if ((next[0] ?? 0) >= 8) state.hours = next
    },
  })

  return (
    <MColumn gap="md">
      <MRangeSlider
        id="price"
        label="Price"
        value={state.price}
        onChange={(value) => (state.price = value)}
        step={5}
        formatValue={(value) => `$${value}`}
      />
      <MText id="price-text">{`From ${state.price[0] ?? 0} to ${state.price[1] ?? 0}`}</MText>
      <MRangeSlider
        label="Hours"
        value={state.hours}
        onChange={(next) => state.plan(next)}
        max={24}
        lowerLabel="Start"
        upperLabel="End"
      />
      <MRangeSlider
        label="Level"
        value={state.level}
        onChange={(value) => (state.level = value)}
        max={5}
        lowerLabel="Lowest"
        upperLabel="Highest"
      />
      <MRangeSlider
        label="Fixed"
        value={[2, 4]}
        onChange={(value) => (state.level = value)}
        max={10}
        readonly
      />
    </MColumn>
  )
}
