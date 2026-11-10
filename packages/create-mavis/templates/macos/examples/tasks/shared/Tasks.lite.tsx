import { useStore, useRef, Show, For } from '@builder.io/mitosis'
import type { Filter, Task } from './types'
import TaskRow from './TaskRow.lite'
import TaskDetail from './TaskDetail.lite'

// A small task manager: one source for every target. Tasks live in memory for the session.
export default function Tasks() {
  const titleRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    tasks: [
      {
        id: 'task1',
        title: 'Sketch the launch page',
        notes: 'Hero, pricing and one honest screenshot.',
        priority: 'high',
        done: false,
      },
      { id: 'task2', title: 'Reply to Noor', notes: '', priority: 'normal', done: true },
      {
        id: 'task3',
        title: 'Book the studio',
        notes: 'Thursday afternoon works best.',
        priority: 'low',
        done: false,
      },
    ] as Task[],
    blank: { id: '', title: '', notes: '', priority: 'normal', done: false } as Task,
    priorities: [
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
    ] as SelectOption[],
    filter: 'all' as Filter,
    selected: 'task1' as string | undefined,
    count: 3,
    title: '',
    notes: '',
    priority: 'normal',
    submitted: false,
    get visible(): Task[] {
      return state.tasks.filter(
        (task) => state.filter === 'all' || (state.filter === 'done') === task.done,
      )
    },
    get done(): number {
      return state.tasks.filter((task) => task.done).length
    },
    get summary(): string {
      return `${state.tasks.length - state.done} open · ${state.done} done`
    },
    get current(): Task {
      return state.tasks.find((task) => task.id === state.selected) ?? state.blank
    },
    get hasCurrent(): boolean {
      return state.tasks.some((task) => task.id === state.selected)
    },
    get position(): number {
      return state.visible.findIndex((task) => task.id === state.selected)
    },
    get titleError(): string {
      return state.submitted && state.title.trim() === '' ? 'Give the task a title' : ''
    },
    compose() {
      titleRef.focus()
    },
    add() {
      state.submitted = true
      if (state.titleError !== '') {
        titleRef.focus()
        return
      }
      state.count += 1
      state.tasks.unshift({
        id: `task${state.count}`,
        title: state.title.trim(),
        notes: state.notes,
        priority: state.priority,
        done: false,
      })
      state.selected = `task${state.count}`
      // A new task is open: leave the Done filter so it shows up.
      if (state.filter === 'done') state.filter = 'all'
      state.title = ''
      state.notes = ''
      state.priority = 'normal'
      state.submitted = false
    },
    toggle() {
      state.tasks = state.tasks.map((task) =>
        task.id === state.selected ? { ...task, done: !task.done } : task,
      )
    },
    rename(title: string) {
      state.tasks = state.tasks.map((task) =>
        task.id === state.selected ? { ...task, title } : task,
      )
    },
    annotate(notes: string) {
      state.tasks = state.tasks.map((task) =>
        task.id === state.selected ? { ...task, notes } : task,
      )
    },
    prioritize(priority: string) {
      state.tasks = state.tasks.map((task) =>
        task.id === state.selected ? { ...task, priority } : task,
      )
    },
    move(by: number) {
      // Swap places with the neighbour on screen, also when a filter hides tasks in between.
      const task = state.visible[state.position]
      const other = state.visible[state.position + by]
      if (task === undefined) return
      if (other === undefined) return
      const from = state.tasks.findIndex((item) => item.id === task.id)
      const to = state.tasks.findIndex((item) => item.id === other.id)
      state.tasks.splice(from, 1)
      state.tasks.splice(to, 0, task)
    },
    remove() {
      const index = state.tasks.findIndex((task) => task.id === state.selected)
      if (index < 0) return
      // The neighbour on screen takes the selection.
      const next = state.visible[state.position + 1] ?? state.visible[state.position - 1]
      state.tasks.splice(index, 1)
      state.selected = next?.id
    },
    step(key: string) {
      const by = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0
      const task =
        state.visible[Math.max(0, Math.min(state.position + by, state.visible.length - 1))]
      if (task !== undefined) state.selected = task.id
    },
  })
  return (
    <MColumn gap="lg">
      <MColumn gap="xs">
        <MText variant="title">Tasks</MText>
        <MText tone="muted">{state.summary}</MText>
      </MColumn>
      <MRow gap="sm">
        <MButton text="New task" shortcut="mod+k" onClick={() => state.compose()} />
        <MButton
          text={state.current.done ? 'Reopen' : 'Complete'}
          variant="secondary"
          shortcut="mod+Enter"
          disabled={!state.hasCurrent}
          onClick={() => state.toggle()}
        />
        <MButton
          text="Delete"
          variant="secondary"
          shortcut="mod+d"
          disabled={!state.hasCurrent}
          onClick={() => state.remove()}
        />
      </MRow>
      <MGrid gap="lg" columns={2} minColumnWidth={320}>
        <MColumn gap="md">
          <MRow gap="sm">
            <MButton
              text={`All (${state.tasks.length})`}
              variant={state.filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => (state.filter = 'all')}
            />
            <MButton
              text={`Open (${state.tasks.length - state.done})`}
              variant={state.filter === 'open' ? 'primary' : 'secondary'}
              onClick={() => (state.filter = 'open')}
            />
            <MButton
              text={`Done (${state.done})`}
              variant={state.filter === 'done' ? 'primary' : 'secondary'}
              onClick={() => (state.filter = 'done')}
            />
          </MRow>
          <Show
            when={state.tasks.length > 0}
            else={<MText tone="muted">No tasks yet. Add the first one.</MText>}
          >
            <Show
              when={state.visible.length > 0}
              else={<MText tone="muted">Nothing here. Try another filter.</MText>}
            >
              <MColumn gap="sm" label="Tasks" onKeyDown={(key) => state.step(key)}>
                <For each={state.visible} animate>
                  {(task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      selected={task.id === state.selected}
                      onSelect={(id) => (state.selected = id)}
                    />
                  )}
                </For>
              </MColumn>
            </Show>
          </Show>
        </MColumn>
        <MColumn gap="lg">
          <Show
            when={state.hasCurrent}
            else={<MText tone="muted">Select a task to see its details.</MText>}
          >
            <TaskDetail
              task={state.current}
              priorities={state.priorities}
              canMoveUp={state.position > 0}
              canMoveDown={state.position >= 0 && state.position < state.visible.length - 1}
              onToggle={() => state.toggle()}
              onRename={(title) => state.rename(title)}
              onNotes={(notes) => state.annotate(notes)}
              onPriority={(priority) => state.prioritize(priority)}
              onMove={(by) => state.move(by)}
            />
          </Show>
          <MCard gap="md">
            <MText variant="overline" tone="muted">
              NEW TASK
            </MText>
            <MInput
              label="Title"
              ref={titleRef}
              value={state.title}
              onChange={(value) => (state.title = value)}
              placeholder="What needs doing?"
              maxLength={60}
              error={state.titleError}
              onSubmit={() => state.add()}
            />
            <MInput
              label="Notes"
              multiline
              rows={2}
              value={state.notes}
              onChange={(value) => (state.notes = value)}
            />
            <MSelect
              label="Priority"
              value={state.priority}
              options={state.priorities}
              onChange={(value) => (state.priority = value)}
            />
            <MRow gap="sm">
              <MButton text="Add task" onClick={() => state.add()} />
            </MRow>
          </MCard>
        </MColumn>
      </MGrid>
    </MColumn>
  )
}
