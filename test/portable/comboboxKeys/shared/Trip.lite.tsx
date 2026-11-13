import { useStore } from '@builder.io/mitosis'

export default function Trip() {
  const state = useStore({
    city: undefined as ChoiceValue | undefined,
    query: 'l',
    locked: false,
    events: 0,
    cities: [
      { value: 'lis', label: 'Lisbon' },
      { value: 'lim', label: 'Lima' },
      { value: 'lyo', label: 'Lyon', disabled: true },
      { value: 'osl', label: 'Oslo' },
    ] as SelectOption[],
    get summary(): string {
      return `City ${state.city ?? 'none'}, query "${state.query}", ${state.events} choices`
    },
  })

  return (
    <MColumn gap="md">
      <MCombobox
        id="city"
        label="City"
        value={state.city}
        onChange={(value) => (state.city = value)}
        query={state.query}
        onQueryChange={(value) => (state.query = value)}
        selectedOption={state.cities.find((item) => item.value === state.city)}
        search={async (text) =>
          state.cities.filter((item) => item.label.toLowerCase().includes(text.toLowerCase()))
        }
        initialResults={{
          query: 'l',
          options: state.cities.filter((item) => item.label.toLowerCase().includes('l')),
        }}
        debounce={0}
        placeholder="Where to?"
        helperText="Type a city"
        clearLabel="Clear city"
        disabled={state.locked}
        onSelect={() => (state.events += 1)}
      />
      <MText id="summary">{state.summary}</MText>
      <MButton
        id="lock"
        text={state.locked ? 'Unlock' : 'Lock'}
        variant="ghost"
        onClick={() => (state.locked = !state.locked)}
      />
    </MColumn>
  )
}
