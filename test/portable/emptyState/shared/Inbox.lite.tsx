import { useStore } from '@builder.io/mitosis'

export default function Inbox() {
  const state = useStore({
    written: 0,
    get symbol(): MavisIconName {
      return state.written > 0 ? 'mail' : 'inbox'
    },
  })

  return (
    <MColumn id="page" gap="md" width={360}>
      <MEmptyState
        id="empty"
        title="No messages yet"
        description="Messages from your team show up here."
        icon={state.symbol}
        slotActions={
          <>
            <MButton id="write" text="Write one" onClick={() => (state.written += 1)} />
            <MButton id="clear" text="Clear" variant="ghost" onClick={() => (state.written = 0)} />
          </>
        }
      />
      <MEmptyState
        id="found"
        title="Nothing found"
        icon="search"
        tone="accent"
        compact
        titleAs="h3"
      />
      <MEmptyState
        id="done"
        title="All done"
        compact
        width={240}
        slotIllustration={
          <MColumn width={40} height={40} radius="sm" backgroundColor="#E9DDF7">
            <MText>Art</MText>
          </MColumn>
        }
      />
      <MText>{`${state.written} written`}</MText>
    </MColumn>
  )
}
