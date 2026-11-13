import { useStore } from '@builder.io/mitosis'

export default function Daily() {
  const state = useStore({
    edition: 1,
    offline: false,
    paused: false,
    seen: 'idle',
    async reload(context: MavisRefreshContext) {
      if (state.offline) throw new Error('Offline')
      if (context.cancelled) return
      await context.commit(() => {
        state.edition += 1
      })
    },
  })

  return (
    <MColumn gap="md">
      <MRefreshControl
        id="daily"
        label="Morning edition"
        refresh={(context) => state.reload(context)}
        height={320}
        disabled={state.paused}
        successLabel="You are up to date"
        errorLabel="Offline. Your stories are still here."
        retryLabel="Try again"
        onStateChange={(next) => (state.seen = next)}
      >
        <MColumn padding="md" gap="md">
          <MText id="daily-edition">{`Edition ${state.edition}`}</MText>
          <MCard>
            <MText>A different way to start</MText>
            <MBox height={64} />
          </MCard>
          <MCard>
            <MText>Small things, noticed</MText>
            <MBox height={64} />
          </MCard>
          <MCard>
            <MText>Make time for a detour</MText>
            <MBox height={64} />
          </MCard>
        </MColumn>
      </MRefreshControl>
      <MText>{`Last state: ${state.seen}`}</MText>
      <MRow gap="sm" wrap>
        <MButton
          text={state.offline ? 'Go online' : 'Go offline'}
          variant="secondary"
          onClick={() => (state.offline = !state.offline)}
        />
        <MButton
          text={state.paused ? 'Resume updates' : 'Pause updates'}
          variant="secondary"
          onClick={() => (state.paused = !state.paused)}
        />
      </MRow>
    </MColumn>
  )
}
