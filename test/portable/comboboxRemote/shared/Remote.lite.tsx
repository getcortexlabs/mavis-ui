import { useStore } from '@builder.io/mitosis'
import { useCities } from './cities'
export default function Remote() {
  const cities = useCities()
  const state = useStore({
    selected: undefined as ChoiceValue | undefined,
    query: '',
    result: 'No selection',
  })
  return (
    <MColumn gap="md">
      <MCombobox
        label="City"
        value={state.selected}
        onChange={(value) => (state.selected = value)}
        query={state.query}
        onQueryChange={(value) => (state.query = value)}
        search={async (query, context) => {
          context.onCancel(() => cities.cancel())
          const result = await cities.search(query, context.limit)
          return result
        }}
        debounce={0}
        maxResults={2}
        onSelect={(option) => (state.result = option?.label ?? 'No selection')}
      />
      <MText>{state.result}</MText>
    </MColumn>
  )
}
