import { useStore } from '@builder.io/mitosis'
export default function TypedCombo() {
  const state = useStore({
    chosen: null as ChoiceValue | null,
    query: '',
    options: [
      { value: 1, label: 'Number one' },
      { value: '1', label: 'Text one' },
      { value: 0, label: 'Zero' },
    ] as SelectOption[],
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
      <MCombobox
        label="Choice"
        value={state.chosen}
        query={state.query}
        onChange={(value) => (state.chosen = value)}
        onQueryChange={(value) => (state.query = value)}
        search={async (query) =>
          state.options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        }
        minQueryLength={0}
        debounce={0}
      />
      <MText>{state.summary}</MText>
    </MColumn>
  )
}
