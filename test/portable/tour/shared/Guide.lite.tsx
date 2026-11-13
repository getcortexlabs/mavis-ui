import { Show, useStore } from '@builder.io/mitosis'
export default function Guide() {
  const state = useStore({
    step: undefined as string | undefined,
    reason: 'none',
    missing: 'none',
    showEnd: true,
    steps: [
      { id: 'first', title: 'Meet Mavis', description: 'One shared screen.' },
      { id: 'absent', title: 'Unavailable', description: 'This feature is off.' },
      { id: 'last', title: 'Ready to build', description: 'Keep your state.' },
    ] as TourStep[],
  })
  return (
    <MColumn gap="md" padding="lg">
      <MButton text="Start guide" onClick={() => (state.step = 'first')} />
      <MButton text="Remove last target" onClick={() => (state.showEnd = false)} />
      <MTour
        label="Getting started"
        steps={state.steps}
        value={state.step}
        onChange={(value) => (state.step = value)}
        onFinish={(next) => (state.reason = next)}
        onMissing={(name) => (state.missing = name)}
      >
        <MTourTarget name="first">
          {({ active }) => <MText>{active ? 'First active' : 'First idle'}</MText>}
        </MTourTarget>
        <Show when={state.showEnd}>
          <MTourTarget name="last">
            <MText>Last target</MText>
          </MTourTarget>
        </Show>
      </MTour>
      <MText>Step: {state.step ?? 'none'}</MText>
      <MText>Finished: {state.reason}</MText>
      <MText>Missing: {state.missing}</MText>
    </MColumn>
  )
}
