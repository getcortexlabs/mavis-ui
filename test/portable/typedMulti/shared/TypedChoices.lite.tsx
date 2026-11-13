import { useStore } from '@builder.io/mitosis'
export default function TypedChoices() {
  const state = useStore({
    chosen: [] as ChoiceValue[],
    options: [
      { value: 1, label: 'Number one' },
      { value: '1', label: 'Text one' },
      { value: 0, label: 'Zero' },
    ] as SelectOption[],
    get summary(): string {
      return state.chosen.length === 0
        ? 'None'
        : state.chosen.map((value) => (value === 1 ? 'N' : value === '1' ? 'S' : 'Z')).join(', ')
    },
  })
  return (
    <MColumn gap="md">
      <MMultiSelect
        label="Values"
        value={state.chosen}
        options={state.options}
        onChange={(value) => (state.chosen = value)}
        placeholder="Choose values"
      />
      <MText>{state.summary}</MText>
    </MColumn>
  )
}
