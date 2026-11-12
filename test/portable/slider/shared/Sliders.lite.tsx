import { useStore } from '@builder.io/mitosis'

export default function Sliders() {
  const state = useStore({
    volume: 80,
    level: 9,
    capped: 20,
    // The source keeps the cap at 30 or below.
    cap(value: number) {
      if (value <= 30) state.capped = value
    },
  })

  return (
    <MColumn gap="md">
      <MSlider
        id="volume"
        label="Volume"
        value={state.volume}
        onChange={(value) => (state.volume = value)}
      />
      <MText>{`Volume ${state.volume}`}</MText>
      <MSlider
        label="Level"
        value={state.level}
        onChange={(value) => (state.level = value)}
        min={0}
        max={10}
        step={3}
      />
      <MText>{`Level ${state.level}`}</MText>
      <MSlider
        id="cap"
        label="Cap"
        value={state.capped}
        onChange={(value) => state.cap(value)}
        max={50}
        step={10}
      />
      <MText>{`Cap ${state.capped}`}</MText>
      <MSlider
        label="Fixed"
        value={state.capped}
        onChange={(value) => state.cap(value)}
        max={50}
        disabled
      />
    </MColumn>
  )
}
