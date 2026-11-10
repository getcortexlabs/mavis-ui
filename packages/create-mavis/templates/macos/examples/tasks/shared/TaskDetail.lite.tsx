import type { Task } from './types'

// The selected task. Every edit goes straight to the list, so the row updates while you type.
export default function TaskDetail(props: {
  task: Task
  priorities: SelectOption[]
  canMoveUp: boolean
  canMoveDown: boolean
  onToggle: () => void
  onRename: (title: string) => void
  onNotes: (notes: string) => void
  onPriority: (priority: string) => void
  onMove: (by: number) => void
}) {
  return (
    <MCard gap="md">
      <MText variant="overline" tone="muted">
        SELECTED TASK
      </MText>
      <MCheckbox label="Done" checked={props.task.done} onChange={() => props.onToggle()} />
      <MInput
        label="Task title"
        value={props.task.title}
        onChange={(value) => props.onRename(value)}
        maxLength={60}
      />
      <MInput
        label="Task notes"
        multiline
        rows={3}
        value={props.task.notes}
        onChange={(value) => props.onNotes(value)}
        placeholder="Anything worth remembering"
      />
      <MSelect
        label="Task priority"
        value={props.task.priority}
        options={props.priorities}
        onChange={(value) => props.onPriority(value)}
      />
      <MRow gap="sm">
        <MButton
          text="Move up"
          variant="secondary"
          disabled={!props.canMoveUp}
          onClick={() => props.onMove(-1)}
        />
        <MButton
          text="Move down"
          variant="secondary"
          disabled={!props.canMoveDown}
          onClick={() => props.onMove(1)}
        />
      </MRow>
    </MCard>
  )
}
