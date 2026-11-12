import { useStore } from '@builder.io/mitosis'

export default function Ratings() {
  const state = useStore({
    stars: 3,
    taste: 2.5,
    service: 4,
    // The source keeps the service rating at 2 or above.
    serve(next: number) {
      if (next >= 2) state.service = next
    },
  })

  return (
    <MColumn gap="md">
      <MRating
        id="stars"
        label="Stars"
        value={state.stars}
        onChange={(value) => (state.stars = value)}
      />
      <MText id="stars-text">{`Stars ${state.stars}`}</MText>
      <MRating
        label="Taste"
        value={state.taste}
        onChange={(value) => (state.taste = value)}
        max={4}
        step={0.5}
        clearLabel="Clear taste"
        formatValue={(value, most) => `${value} of ${most}`}
      />
      <MText>{`Taste ${state.taste}`}</MText>
      <MRating
        label="Service"
        value={state.service}
        onChange={(next) => state.serve(next)}
        max={4}
        clearable={false}
      />
      <MRating
        label="Average"
        value={3.5}
        onChange={(value) => (state.stars = value)}
        step={0.5}
        readonly
      />
      <MRating
        label="Closed"
        value={state.stars}
        onChange={(value) => (state.stars = value)}
        max={3}
        clearLabel="Clear closed"
        disabled
      />
    </MColumn>
  )
}
