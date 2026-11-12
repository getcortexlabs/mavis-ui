import { useStore } from '@builder.io/mitosis'

export default function Waiting() {
  const state = useStore({
    count: 0,
    busy: false,
    offline: false,
    note: 'Nothing yet',
    async verify() {
      if (state.offline) throw new Error('Offline')
      state.count += 1
    },
    async check() {
      state.busy = true
      state.note = 'Checking'
      try {
        await state.verify()
        await state.verify()
        state.note = `Checked ${state.count}`
      } catch {
        state.note = 'Check failed'
      } finally {
        state.busy = false
      }
    },
    async attempt() {
      try {
        await state.verify()
      } finally {
        state.note = `Tried ${state.count}`
      }
    },
    async guarded() {
      try {
        await state.attempt()
      } catch {
        state.note = `${state.note}, caught`
      }
    },
    start() {
      state.check()
    },
  })

  return (
    <MColumn gap="md">
      <MText>{`Count ${state.count}`}</MText>
      <MText>{state.busy ? 'Busy' : 'Ready'}</MText>
      <MText>{state.note}</MText>
      <MRow gap="sm" wrap>
        <MButton onClick={() => state.check()} text="Check" />
        <MButton onClick={() => state.start()} text="Start" />
        <MButton onClick={() => state.guarded()} text="Try" />
        <MButton
          onClick={() => (state.offline = !state.offline)}
          text={state.offline ? 'Go online' : 'Go offline'}
        />
      </MRow>
    </MColumn>
  )
}
