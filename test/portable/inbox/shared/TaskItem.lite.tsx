import type { Task } from './types'

export default function TaskItem(props: {
  task: Task
  selected: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onInsert: (id: string) => void
  onMove: (id: string, by: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <MRow
      gap="sm"
      label={`Task ${props.task.number}: ${props.task.title}${props.selected ? ', selected' : ''}`}
    >
      <MCheckbox
        label={`Task ${props.task.number} done`}
        checked={props.task.done}
        onChange={() => props.onToggle(props.task.id)}
      />
      <MInput
        label={`Task ${props.task.number} title`}
        value={props.task.title}
        onChange={(value) => props.onRename(props.task.id, value)}
        onSubmit={() => props.onInsert(props.task.id)}
      />
      <MText tone={props.selected ? 'primary' : 'muted'}>
        {`${props.task.done ? 'Done' : 'Open'}${props.selected ? ' · selected' : ''}`}
      </MText>
      <MButton
        text={`Select task ${props.task.number}`}
        variant="secondary"
        onClick={() => props.onSelect(props.task.id)}
      />
      <MButton
        text={`Move task ${props.task.number} up`}
        variant="secondary"
        onClick={() => props.onMove(props.task.id, -1)}
      />
      <MButton
        text={`Move task ${props.task.number} down`}
        variant="secondary"
        onClick={() => props.onMove(props.task.id, 1)}
      />
      <MButton
        text={`Remove task ${props.task.number}`}
        variant="secondary"
        onClick={() => props.onRemove(props.task.id)}
      />
    </MRow>
  )
}
