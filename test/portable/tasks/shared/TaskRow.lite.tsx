import type { Task } from './types'

export default function TaskRow(props: {
  task: Task
  onToggle: (id: string) => void
  onMoveUp: (id: string) => void
}) {
  return (
    <MRow gap="sm">
      <MText tone={props.task.done ? 'muted' : 'text'}>
        {props.task.done ? `✓ ${props.task.title}` : props.task.title}
      </MText>
      <MButton text={`Toggle ${props.task.title}`} onClick={() => props.onToggle(props.task.id)} />
      <MButton
        text={`Up ${props.task.title}`}
        variant="secondary"
        onClick={() => props.onMoveUp(props.task.id)}
      />
    </MRow>
  )
}
