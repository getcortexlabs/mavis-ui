import { useStore } from '@builder.io/mitosis'

export default function Meter() {
  const state = useStore({
    load: 75,
    set(next: number) {
      state.load = next
    },
  })

  return (
    <MColumn id="page" gap="lg">
      <MRow gap="md" align="start">
        <MBox id="dial" width={200} height={360} backgroundColor="#FFF4D6">
          <MColumn>
            <MGauge label="Load" value={state.load} size={200} strokeWidth={18} suffix="%" />
          </MColumn>
        </MBox>
        <MBox id="tinted" width={200} height={360} backgroundColor="#FFF4D6">
          <MColumn>
            <MGauge
              label="Shifted"
              value={state.load}
              min={50}
              max={150}
              size={200}
              strokeWidth={18}
              color="#2F7D6B"
              animated={false}
              formatValue={(value) => `${value} rpm`}
            />
          </MColumn>
        </MBox>
      </MRow>
      <MText>{`Load ${state.load}`}</MText>
      <MRow gap="sm" wrap>
        <MButton text="Low" onClick={() => state.set(25)} />
        <MButton text="High" variant="secondary" onClick={() => state.set(75)} />
        <MButton text="Over" variant="secondary" onClick={() => state.set(140)} />
      </MRow>
      <MRow id="pair" gap="md" align="start">
        <MGauge id="whole" label="Whole" value={state.load} size={120} animateNumber />
        <MColumn id="stack">
          <MBox id="spacer" height={50.4} />
          <MGauge id="half" label="Half" value={state.load} size={120} semi />
        </MColumn>
      </MRow>
    </MColumn>
  )
}
