import { useStore } from '@builder.io/mitosis'
export default function Commands() {
  const state = useStore({
    open: false,
    query: '',
    chosen: 'none',
    loading: false,
    items: [
      { value: 'cafe', label: 'Café', keywords: ['drink'], group: 'Places' },
      { value: 'garden', label: 'Garden', group: 'Places' },
      { value: 'locked', label: 'Locked', disabled: true },
    ] as CommandItem[],
  })
  return (
    <MColumn gap="md" padding="lg">
      <MButton
        text="Open commands"
        onClick={() => {
          state.open = true
        }}
      />
      <MText>Chosen: {state.chosen}</MText>
      <MText>Query: {state.query}</MText>
      <MCommandPalette
        label="Find an action"
        items={state.items}
        open={state.open}
        onUpdateOpen={(value) => {
          state.open = value
        }}
        query={state.query}
        onQueryChange={(value) => {
          state.query = value
        }}
        onSelect={(value) => {
          state.chosen = value
        }}
        loading={state.loading}
        shortcut
      />
    </MColumn>
  )
}
