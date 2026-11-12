import { useStore } from '@builder.io/mitosis'

export default function Retouch() {
  const state = useStore({ position: 50, upright: false })

  return (
    <MColumn gap="md" width={360}>
      <MBox id="compare">
        <MImageCompare
          label="Photo comparison"
          before="~/assets/compare-before.png"
          after="~/assets/compare-after.png"
          beforeLabel="Original"
          afterLabel="Edited"
          value={state.position}
          onChange={(value) => (state.position = value)}
          step={5}
          aspectRatio={2}
          orientation={state.upright ? 'vertical' : 'horizontal'}
        />
        <MColumn paddingX={80} paddingY={70}>
          <MRow justify="between">
            <MColumn id="near" width={6} height={6} />
            <MColumn id="far" width={6} height={6} />
          </MRow>
        </MColumn>
      </MBox>
      <MText>Showing {state.position}% of the original</MText>
      <MRow gap="sm" wrap>
        <MButton text="All" onClick={() => (state.position = 100)} />
        <MButton text="None" onClick={() => (state.position = 0)} />
        <MButton text="Half" onClick={() => (state.position = 50)} />
        <MButton text="Turn" onClick={() => (state.upright = !state.upright)} />
      </MRow>
    </MColumn>
  )
}
