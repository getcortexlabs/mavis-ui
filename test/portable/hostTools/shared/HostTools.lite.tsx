import { Show, useStore } from '@builder.io/mitosis'
import { useUtilities } from './utilities'
import Scheduled from './Scheduled.lite'
export default function HostTools() {
  const tools = useUtilities()
  const state = useStore({ shown: false })
  return (
    <MColumn gap="md">
      <MText>{tools.summary.value}</MText>
      <MText>
        {tools.timer.value}; completed {tools.completed.value}; cancelled {tools.cancelled.value}
      </MText>
      <MButton text="Use platform tools" onClick={() => tools.demonstrate()} />
      <MButton text="Run short timer" onClick={() => tools.run(25)} />
      <MButton
        text="Show scheduled child"
        onClick={() => {
          state.shown = true
        }}
      />
      <MButton
        text="Hide scheduled child"
        onClick={() => {
          state.shown = false
        }}
      />
      <Show when={state.shown}>
        <Scheduled />
      </Show>
    </MColumn>
  )
}
