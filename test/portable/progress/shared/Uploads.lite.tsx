import { useStore } from '@builder.io/mitosis'

export default function Uploads() {
  const state = useStore({ sent: 25, waiting: false })

  return (
    <MColumn id="page" gap="md" width={320}>
      <MText>{state.waiting ? 'Waiting for the server' : `Sent ${state.sent} of 100`}</MText>
      <MProgress
        id="upload"
        label="Upload"
        value={state.sent}
        indeterminate={state.waiting}
        indeterminateLabel="Waiting for the server"
      />
      <MProgress id="thin" label="Storage" value={3} max={4} size="sm" tone="success" />
      <MProgress id="thick" label="Quota" value={150} size="lg" tone="danger" />
      <MProgress id="none" label="Queue" value={-5} tone="accent" />
      <MRow id="sized" gap="sm">
        <MProgress id="fixed" label="Download" value={60} width={120} tone="warning" />
        <MProgress id="grown" label="Install" value={60} grow={1} tone="accent" />
      </MRow>
      <MColumn id="start" align="start">
        <MProgress id="half" label="Sync" value={60} width="50%" />
      </MColumn>
      <MRow gap="sm">
        <MButton text="Send more" onClick={() => (state.sent += 50)} />
        <MButton text="Wait" onClick={() => (state.waiting = !state.waiting)} />
      </MRow>
    </MColumn>
  )
}
