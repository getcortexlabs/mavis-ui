import { useStore } from '@builder.io/mitosis'

export default function Team() {
  const state = useStore({
    opened: 'nobody',
    locked: false,
    lock() {
      state.locked = !state.locked
    },
  })

  return (
    <MColumn gap="md">
      <MListItem
        id="plain"
        title="Marina Costa"
        description="Design, São Paulo"
        slotLeading={
          <MColumn id="plain-lead" width={40} height={40} radius="full" backgroundColor="#E9DDF7" />
        }
        slotTrailing={
          <MText id="plain-trail" variant="caption" tone="muted">
            Online
          </MText>
        }
      />
      <MRow id="pair" gap="md" align="start">
        <MListItem id="bare" title="Only a title" grow={1} />
        <MListItem id="narrow" title="Fixed" description="A third" width={220} />
      </MRow>
      <MListItem
        title="Rui Tavares"
        description="Engineering"
        onClick={() => (state.opened = 'Rui')}
        slotLeading={<MText>RT</MText>}
      />
      <MListItem
        title="Ines Prado"
        description="Support"
        accessibilityLabel="Open Ines Prado, away"
        disabled={state.locked}
        onClick={() => (state.opened = 'Ines')}
        slotTrailing={<MText variant="caption">Away</MText>}
      />
      <MRow gap="sm">
        <MButton text={state.locked ? 'Unlock' : 'Lock'} onClick={() => state.lock()} />
        <MText id="opened">{`Opened: ${state.opened}`}</MText>
      </MRow>
    </MColumn>
  )
}
