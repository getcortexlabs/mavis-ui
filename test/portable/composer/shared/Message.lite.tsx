import { useStore } from '@builder.io/mitosis'

export default function Message() {
  const state = useStore({
    text: 'Hello from Mavis',
    files: [{ id: 'brief', name: 'Brief.pdf' }] as ComposerAttachment[],
    sent: 'Not sent',
    count: 0,
    locked: false,
    loading: false,
    attach() {
      state.files = [{ id: 'brief', name: 'Brief.pdf' }]
    },
    send(message: ComposerMessage) {
      state.count = state.count + 1
      state.sent = `${message.text} (${message.attachments.length} attachments)`
    },
  })

  return (
    <MColumn gap="md">
      <MComposer
        id="message"
        label="Message"
        value={state.text}
        onChange={(value) => (state.text = value)}
        attachments={state.files}
        onAttachmentsChange={(value) => (state.files = value)}
        onAttach={() => state.attach()}
        onSubmit={(message) => state.send(message)}
        disabled={state.locked}
        loading={state.loading}
        placeholder="Write something"
        maxLength={120}
      >
        <MText>Draft stays until you clear it</MText>
      </MComposer>
      <MText id="sent">{state.sent}</MText>
      <MText id="count">{`Sent ${state.count}`}</MText>
      <MText id="draft">{`Draft: ${state.text}`}</MText>
      <MButton text="Clear draft" onClick={() => (state.text = '')} />
      <MButton
        text={state.locked ? 'Unlock' : 'Lock'}
        onClick={() => (state.locked = !state.locked)}
      />
      <MButton
        text={state.loading ? 'Stop sending' : 'Start sending'}
        onClick={() => (state.loading = !state.loading)}
      />
    </MColumn>
  )
}
