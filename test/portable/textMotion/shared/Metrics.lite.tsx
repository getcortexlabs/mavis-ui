import { useStore } from '@builder.io/mitosis'
export default function Metrics() {
  const state = useStore({ value: 1234.5, replay: 0, text: 'Made to move', animated: true })
  return (
    <MColumn gap="md">
      <MAnimatedText
        text={state.text}
        replayKey={state.replay}
        animated={state.animated}
        by="word"
      />
      <MNumberFlow
        value={state.value}
        locale="en-US"
        format={{
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
        label="Revenue"
        animated={state.animated}
      />
      <MNumberFlow
        value={state.value}
        formatValue={(value) => `${value.toFixed(1)} points`}
        animated={state.animated}
        tone="primary"
      />
      <MButton
        text="Advance"
        onClick={() => {
          state.value += 10
          state.replay += 1
          state.text = 'Sharing every platform'
        }}
      />
      <MButton
        text={state.animated ? 'Disable motion' : 'Enable motion'}
        onClick={() => (state.animated = !state.animated)}
      />
    </MColumn>
  )
}
