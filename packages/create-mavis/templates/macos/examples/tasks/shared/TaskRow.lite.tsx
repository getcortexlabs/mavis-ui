import { Show } from '@builder.io/mitosis'
import type { Task } from './types'

// One task in the list. The whole card is a button; its label is what assistive technology reads.
export default function TaskRow(props: {
  task: Task
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <MCard
      gap="xs"
      padding="md"
      tone={props.selected ? 'primarySoft' : 'surface'}
      label={`${props.task.title}, ${props.task.done ? 'done' : 'open'}, ${props.task.priority} priority${props.selected ? ', selected' : ''}`}
      onClick={() => props.onSelect(props.task.id)}
    >
      <MText tone={props.task.done ? 'muted' : 'text'}>{props.task.title}</MText>
      <MText variant="caption" tone="muted">
        {props.task.priority === 'high'
          ? 'High priority'
          : props.task.priority === 'low'
            ? 'Low priority'
            : 'Normal priority'}
      </MText>
      <Show when={props.task.done} animate>
        <MText variant="caption" tone="success">
          Done
        </MText>
      </Show>
    </MCard>
  )
}
