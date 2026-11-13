import { useStore } from '@builder.io/mitosis'

export default function Toolbar() {
  const state = useStore({
    added: 0,
    symbol: 'heart' as MavisIconName,
    saving: false,
    query: '',
    notes: '',
    email: '',
  })

  return (
    <MColumn gap="md">
      <MRow id="only" gap="md" align="start">
        <MButton
          id="only-lg"
          icon="plus"
          size="lg"
          accessibilityLabel="Add one"
          onClick={() => (state.added += 1)}
        />
        <MButton
          id="only-md"
          trailingIcon="plus"
          accessibilityLabel="Add two"
          onClick={() => (state.added += 2)}
        />
        <MButton
          id="only-sm"
          icon={state.symbol}
          size="sm"
          variant="secondary"
          accessibilityLabel="Add three"
          onClick={() => (state.added += 3)}
        />
      </MRow>
      <MText>{state.added} added</MText>
      <MRow id="sides" gap="md" align="start">
        <MButton id="leading" text="Next" icon="arrow-right" onClick={() => (state.added = 0)} />
        <MButton
          id="trailing"
          text="Next"
          trailingIcon="arrow-right"
          variant="secondary"
          onClick={() => (state.symbol = 'star')}
        />
        <MButton id="plain" text="Next" variant="ghost" onClick={() => (state.added = 0)} />
      </MRow>
      <MRow gap="md" align="start">
        <MButton
          text="Save"
          icon="save"
          trailingIcon="chevron-down"
          loading={state.saving}
          loadingText="Saving"
          loadingIndicator="ring"
          onClick={() => (state.saving = true)}
        />
      </MRow>
      <MInput
        label="Search"
        value={state.query}
        onChange={(value) => (state.query = value)}
        placeholder="Find a place"
        icon="search"
        trailingIcon="mic"
      />
      <MInput
        label="Notes"
        value={state.notes}
        onChange={(value) => (state.notes = value)}
        multiline
        icon="pencil"
      />
      <MInput
        label="Email"
        value={state.email}
        onChange={(value) => (state.email = value)}
        error="Enter your email"
        trailingIcon={state.symbol}
      />
    </MColumn>
  )
}
