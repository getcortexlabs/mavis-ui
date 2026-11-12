import { useStore } from '@builder.io/mitosis'

export default function Badges() {
  const state = useStore({
    unread: 11,
    urgent: false,
    get tone(): MavisBadgeTone {
      return state.urgent ? 'danger' : 'primary'
    },
  })

  return (
    <MColumn id="page" gap="md" width={320}>
      <MRow id="tones" gap="sm">
        <MBadge id="neutral" text="Draft" />
        <MBadge id="primary" text="New" tone="primary" />
        <MBadge id="accent" text="Beta" tone="accent" />
      </MRow>
      <MRow id="states" gap="sm">
        <MBadge id="success" text="Paid" tone="success" />
        <MBadge id="warning" text="Late" tone="warning" />
        <MBadge id="danger" text="Failed" tone="danger" />
      </MRow>
      <MRow id="counts" gap="sm" height={48}>
        <MBadge id="unread" text={state.unread} tone={state.tone} />
        <MBadge id="small" text={11} size="sm" tone="accent" />
        <MBadge id="one" text="1" />
        <MBadge id="named" text="3" size="sm" accessibilityLabel="3 replies" />
      </MRow>
      <MColumn id="narrow" width={120}>
        <MBadge id="long" text="Waiting for review" tone="warning" />
      </MColumn>
      <MRow gap="sm">
        <MButton text="Receive" onClick={() => (state.unread += 100)} />
        <MButton text="Escalate" onClick={() => (state.urgent = !state.urgent)} />
      </MRow>
    </MColumn>
  )
}
