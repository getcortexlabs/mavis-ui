import { useStore } from '@builder.io/mitosis'
export default function Celebration() {
  const state = useStore({ trigger: 0, count: 0, disabled: false, active: false, reason: 'None' })
  return (
    <MColumn gap="md">
      <MConfetti
        trigger={state.trigger}
        disabled={state.disabled}
        count={20}
        onBurst={() => (state.count += 1)}
        onSkipped={(next) => {
          state.count += 1
          state.reason = next
        }}
      >
        <MColumn padding="md">
          <MText>Saved successfully</MText>
          <MButton text="Celebrate" onClick={() => (state.trigger += 1)} />
        </MColumn>
      </MConfetti>
      <MParticleField active={state.active} duration={800} lifetime={500} height={120} shape="ring">
        <MColumn padding="md">
          <MText>Scoped atmosphere</MText>
        </MColumn>
      </MParticleField>
      <MText>{`Requests ${state.count}`}</MText>
      <MButton
        text="Disable celebrations"
        onClick={() => {
          state.disabled = true
          state.reason = 'None'
        }}
      />
      <MButton
        text={state.active ? 'Stop atmosphere' : 'Start atmosphere'}
        onClick={() => (state.active = !state.active)}
      />
    </MColumn>
  )
}
