import { useStore } from '@builder.io/mitosis'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'

export default function Files() {
  const files = useFileSelection({
    multiple: true,
    maxCount: 3,
    maxSize: 4096,
    accept: ['.pdf', 'image/*'],
    initial: [
      { id: 'brief', name: 'Brief.pdf', size: 120, type: 'application/pdf', status: 'uploaded' },
      {
        id: 'photo',
        name: 'Photo.png',
        size: 240,
        type: 'image/png',
        status: 'failed',
        error: 'Try another connection',
      },
    ],
  })
  const state = useStore({ locked: false, inspected: 'Not inspected' })
  return (
    <MColumn gap="md">
      <MFilePicker
        label="Documents"
        selection={files}
        disabled={state.locked}
        chooseLabel="Browse documents"
        removeLabel="Forget"
        emptyLabel="Nothing selected"
        statusLabels={{ uploaded: 'Stored', failed: 'Needs attention' }}
      />
      <MText>{state.inspected}</MText>
      <MButton
        text="Inspect retained file"
        onClick={() =>
          (state.inspected = files.hasFile('brief') ? 'Has resource' : 'Metadata only')
        }
      />
      <MButton text="Remove brief from owner" onClick={() => files.remove('brief')} />
      <MButton text="Clear all" onClick={() => files.clear()} />
      <MButton
        text={state.locked ? 'Unlock' : 'Lock'}
        onClick={() => (state.locked = !state.locked)}
      />
    </MColumn>
  )
}
