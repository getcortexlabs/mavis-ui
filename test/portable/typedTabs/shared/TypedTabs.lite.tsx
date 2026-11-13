import { useStore } from '@builder.io/mitosis'
export default function TypedTabs() {
  const state = useStore({
    value: undefined as ChoiceValue | undefined,
    tabs: [
      { value: 1, label: 'Number tab' },
      { value: '1', label: 'Text tab' },
      { value: 0, label: 'Zero tab' },
    ] as TabOption[],
    steps: [
      { value: 1, label: 'Number step' },
      { value: '1', label: 'Text step' },
      { value: 0, label: 'Zero step' },
    ] as StepOption[],
    get summary(): string {
      return state.value === 1
        ? 'Numeric one'
        : state.value === '1'
          ? 'Textual one'
          : state.value === 0
            ? 'Zero'
            : 'None'
    },
  })
  return (
    <MColumn gap="md">
      <MTabs
        label="Typed tabs"
        tabs={state.tabs}
        value={state.value}
        onChange={(value) => (state.value = value)}
        keepAlive
      >
        {({ value }) => (
          <MText>
            {value === 1 ? 'Number panel' : value === '1' ? 'Text panel' : 'Zero panel'}
          </MText>
        )}
      </MTabs>
      <MSteps
        label="Typed steps"
        steps={state.steps}
        value={state.value}
        onChange={(value) => (state.value = value)}
      />
      <MText>{state.summary}</MText>
      <MButton text="Clear" onClick={() => (state.value = undefined)} />
    </MColumn>
  )
}
