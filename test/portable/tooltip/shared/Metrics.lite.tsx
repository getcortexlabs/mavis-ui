import { useStore } from '@builder.io/mitosis'

export default function Metrics() {
  const state = useStore({ locked: false, detailed: false })

  return (
    <MScreen>
      <MColumn id="page" gap="lg" padding="lg">
        <MColumn id="top" height={120} />
        <MRow id="active" gap="sm">
          <MTooltip
            id="active-help"
            triggerLabel="About active members"
            text={
              state.detailed
                ? 'Members who opened the app in the last seven days, counted once.'
                : 'Active in the last seven days.'
            }
          />
          <MText>Active members</MText>
        </MRow>
        <MRow id="revenue" gap="sm">
          <MColumn grow={1}>
            <MText>Revenue</MText>
          </MColumn>
          <MTooltip
            id="revenue-help"
            triggerLabel="About revenue"
            text="Paid invoices, before refunds."
            icon="circle-question-mark"
            variant="secondary"
            placement="bottom-end"
            disabled={state.locked}
          />
        </MRow>
        <MRow gap="sm">
          <MButton text="More detail" onClick={() => (state.detailed = !state.detailed)} />
          <MButton text="Lock" onClick={() => (state.locked = !state.locked)} />
        </MRow>
      </MColumn>
    </MScreen>
  )
}
