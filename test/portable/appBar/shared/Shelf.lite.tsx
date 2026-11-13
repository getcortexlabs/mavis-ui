import { useStore } from '@builder.io/mitosis'

export default function Shelf() {
  const state = useStore({
    left: 0,
    told: 0,
    saved: false,
    leave() {
      state.left = state.left + 1
    },
  })

  return (
    <MColumn gap="md">
      <MAppBar
        id="bar"
        title="Library"
        subtitle={`Left ${state.left} times`}
        back
        backLabel="Back to shelves"
        navigateBack={() => state.leave()}
        onBack={() => (state.told = state.told + 1)}
        slotLeading={<MIcon id="mark" name="book-open" />}
        slotActions={
          <MButton
            id="save"
            text="Save"
            variant="secondary"
            size="sm"
            onClick={() => (state.saved = true)}
          />
        }
      />
      <MText id="status">{`${state.saved ? 'Saved' : 'Not saved'}, told ${state.told}`}</MText>
      <MAppBar id="plain" title="Plain" />
    </MColumn>
  )
}
