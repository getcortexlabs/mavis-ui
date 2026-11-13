import { useStore } from '@builder.io/mitosis'
import { useWork } from './work'

export default function PendingProps(props: { id: string }) {
  const work = useWork()
  const state = useStore({
    status: 'No pending draft',
    async wait() {
      const before = props.id
      state.status = 'Waiting for ' + before
      await work.load()
      state.status = props.id === before ? 'Applied ' + before : 'Ignored ' + before
    },
  })
  return (
    <MColumn gap="md">
      <MText>{state.status}</MText>
      <MButton text="Wait with current id" onClick={() => state.wait()} />
    </MColumn>
  )
}
