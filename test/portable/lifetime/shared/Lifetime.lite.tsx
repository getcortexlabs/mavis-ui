import { Show, useStore } from '@builder.io/mitosis'
import { useWork } from './work'
import Working from './Working.lite'

export default function Lifetime() {
  const work = useWork()
  const state = useStore({ shown: true, completed: 0, disposed: 0 })
  return (
    <MColumn gap="md">
      <MText>{work.status.value}</MText>
      <MText>
        Cancelled {work.cancelled.value}, committed {work.committed.value}
      </MText>
      <MText>
        Completed {state.completed}, disposed {state.disposed}
      </MText>
      <MButton
        text="Hide child"
        onClick={() => {
          state.shown = false
        }}
      />
      <MButton
        text="Show child"
        onClick={() => {
          state.shown = true
        }}
      />
      <MButton text="Finish pending work" onClick={() => work.finish()} />
      <Show when={state.shown}>
        <Working
          onComplete={() => {
            state.completed += 1
          }}
          onDisposed={() => {
            state.disposed += 1
          }}
        />
      </Show>
    </MColumn>
  )
}
