import { useStore } from '@builder.io/mitosis'

export default function Booking() {
  const state = useStore({
    confirm: false,
    remove: false,
    removing: false,
    status: 'draft',
    reason: 'none',
  })

  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText variant="title" as="h1">
          Trip to Lisbon
        </MText>
        <MText>{`Status: ${state.status}`}</MText>
        <MColumn id="closed">
          <MText>{`Last close: ${state.reason}`}</MText>
        </MColumn>
        <MDialog
          open={state.confirm}
          onUpdateOpen={(value) => (state.confirm = value)}
          onClose={(next) => (state.reason = next)}
          onConfirm={() => {
            state.status = 'booked'
            state.confirm = false
          }}
          title="Confirm booking?"
          description="You will be charged now."
          confirmLabel="Book now"
          cancelLabel="Not yet"
        />
        <MRow id="actions" gap="sm">
          <MButton text="Book" onClick={() => (state.confirm = true)} />
          <MButton text="Delete trip" variant="secondary" onClick={() => (state.remove = true)} />
        </MRow>
        <MDialog
          open={state.remove}
          onUpdateOpen={(value) => (state.remove = value)}
          onClose={(next) => (state.reason = next)}
          onConfirm={() => (state.removing = true)}
          title="Delete this trip?"
          description="This cannot be undone."
          confirmLabel="Delete"
          loadingLabel="Deleting…"
          tone="danger"
          loading={state.removing}
          dismissible={false}
        />
      </MColumn>
    </MScreen>
  )
}
