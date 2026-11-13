import { useStore } from '@builder.io/mitosis'
export default function TypedRadios() {
  const state = useStore({
    chosen: null as ChoiceValue | null,
    options: [
      { value: 1, label: 'Number one' },
      { value: '1', label: 'Text one' },
      { value: 0, label: 'Zero' },
    ] as ChoiceOption[],
    segments: [
      { value: 1, label: 'Segment number' },
      { value: '1', label: 'Segment text' },
      { value: 0, label: 'Segment zero' },
    ] as SegmentedOption[],
    get summary(): string {
      return state.chosen === null
        ? 'None'
        : state.chosen === 1
          ? 'Numeric one'
          : state.chosen === '1'
            ? 'Textual one'
            : 'Zero'
    },
  })
  return (
    <MColumn gap="md">
      <MRadioGroup
        label="Radio"
        value={state.chosen}
        options={state.options}
        onChange={(value) => (state.chosen = value)}
      />
      <MSegmentedControl
        label="Segments"
        value={state.chosen}
        options={state.segments}
        onChange={(value) => (state.chosen = value)}
      />
      <MText>{state.summary}</MText>
    </MColumn>
  )
}
