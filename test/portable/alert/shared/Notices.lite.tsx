import { Show, useStore } from '@builder.io/mitosis'

export default function Notices() {
  const state = useStore({
    saved: true,
    tries: 0,
    get tone(): MavisAlertTone {
      return state.tries > 1 ? 'error' : 'warning'
    },
  })

  return (
    <MColumn id="page" gap="md" width={360}>
      <MText>{state.saved ? 'Saved' : 'Dismissed'}</MText>
      <MAlert
        id="sync"
        title="Sync is on"
        description="Changes reach your other devices in a moment."
      />
      <Show when={state.saved}>
        <MAlert
          id="saved"
          title="Draft saved"
          tone="success"
          dismissible
          closeLabel="Dismiss saved"
          onClose={() => (state.saved = false)}
        />
      </Show>
      <MAlert
        id="failed"
        title="Upload failed"
        description={`Tried ${state.tries} times.`}
        tone={state.tone}
        announce
        slotActions={
          <>
            <MButton id="retry" text="Retry" size="sm" onClick={() => (state.tries += 1)} />
            <MButton
              id="forget"
              text="Forget"
              variant="ghost"
              size="sm"
              onClick={() => (state.tries = 0)}
            />
          </>
        }
      />
      <MAlert id="narrow" title="Almost full" tone="warning" width={240} />
      <MButton text="Restore" onClick={() => (state.saved = true)} />
    </MColumn>
  )
}
