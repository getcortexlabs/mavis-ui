import { Show, For } from '@builder.io/mitosis'
import type { Task } from './types'

export default function TaskList(props: {
  tasks: Task[]
  slotRow?: (props: { task: Task; position: number }) => JSX.Element
  slotEmpty?: JSX.Element
}) {
  return (
    <MColumn gap="xs">
      <For each={props.tasks}>
        {(task, index) => (
          <MRow key={task.id} gap="sm">
            {props.slotRow?.({ task, position: index + 1 }) ?? <MText>{task.title}</MText>}
          </MRow>
        )}
      </For>
      <Show when={props.tasks.length === 0}>
        {props.slotEmpty ?? <MText tone="muted">No tasks</MText>}
      </Show>
    </MColumn>
  )
}
