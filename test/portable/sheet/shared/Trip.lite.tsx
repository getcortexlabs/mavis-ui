import { useStore } from '@builder.io/mitosis'

export default function Trip() {
  const state = useStore({
    search: false,
    terms: false,
    locked: false,
    guests: 1,
    reason: 'none',
  })

  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText variant="title" as="h1">
          Lisbon weekend
        </MText>
        <MText>{`Guests: ${state.guests}`}</MText>
        <MColumn id="summary">
          <MText>{`Last close: ${state.reason}`}</MText>
        </MColumn>
        <MSheet
          id="search"
          open={state.search}
          onUpdateOpen={(value) => {
            if (!state.locked) state.search = value
          }}
          onClose={(next) => (state.reason = next)}
          title="Search flights"
          closeLabel="Close search"
          gap="md"
        >
          <MText>{`Guests: ${state.guests}`}</MText>
          <MText>{`Last close: ${state.reason}`}</MText>
          <MColumn id="search-swatch" height={24} />
          <MRow gap="sm">
            <MButton text="Add guest" variant="secondary" onClick={() => (state.guests += 1)} />
            <MButton
              text={state.locked ? 'Unlock' : 'Lock'}
              variant="secondary"
              onClick={() => (state.locked = !state.locked)}
            />
          </MRow>
          <MColumn id="search-done">
            <MButton text="Done" onClick={() => (state.search = false)} />
          </MColumn>
        </MSheet>
        <MRow id="actions" gap="sm">
          <MButton text="Find flights" onClick={() => (state.search = true)} />
          <MButton text="Terms" variant="secondary" onClick={() => (state.terms = true)} />
        </MRow>
        <MSheet
          open={state.terms}
          onUpdateOpen={(value) => (state.terms = value)}
          onClose={(next) => (state.reason = next)}
          accessibilityLabel="Terms of the trip"
          dismissible={false}
          fullscreen
          gap="md"
        >
          <MColumn id="terms-body">
            <MText>No refunds after Friday.</MText>
          </MColumn>
          <MButton text="Accept" onClick={() => (state.terms = false)} />
        </MSheet>
      </MColumn>
    </MScreen>
  )
}
