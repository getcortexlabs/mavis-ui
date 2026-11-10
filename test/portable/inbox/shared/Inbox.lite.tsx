import { useStore, Show, For } from '@builder.io/mitosis'
import type { Filter, Task } from './types'
import TaskItem from './TaskItem.lite'

export default function Inbox() {
  const state = useStore({
    tasks: [
      { id: 'write', number: 1, title: 'Write notes', done: false },
      { id: 'review', number: 2, title: 'Review copy', done: true },
      { id: 'ship', number: 3, title: 'Ship build', done: false },
    ] as Task[],
    filter: 'all' as Filter,
    sorted: false,
    selected: 'write' as string | undefined,
    draft: '',
    count: 3,
    get visible(): Task[] {
      const shown = state.tasks.filter(
        (task) => state.filter === 'all' || (state.filter === 'done') === task.done,
      )
      return state.sorted
        ? shown.toSorted((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0))
        : shown
    },
    get done(): number {
      return state.tasks.filter((task) => task.done).length
    },
    get summary(): string {
      return `${state.tasks.length - state.done} open, ${state.done} done`
    },
    get selection(): string {
      const task = state.tasks.find((task) => task.id === state.selected)
      return task === undefined ? 'Nothing selected' : `Selected: ${task.title}`
    },
    add() {
      const title = state.draft.trim()
      if (title === '') return
      state.count += 1
      state.tasks.unshift({ id: `task${state.count}`, number: state.count, title, done: false })
      state.draft = ''
    },
    insertAfter(id: string) {
      const index = state.tasks.findIndex((task) => task.id === id)
      if (index < 0) return
      state.count += 1
      state.tasks.splice(index + 1, 0, {
        id: `task${state.count}`,
        number: state.count,
        title: 'New task',
        done: false,
      })
    },
    toggle(id: string) {
      state.tasks = state.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      )
    },
    rename(id: string, title: string) {
      state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, title } : task))
    },
    completeAll(done: boolean) {
      state.tasks = state.tasks.map((task) => ({ ...task, done }))
    },
    move(id: string, by: number) {
      const index = state.tasks.findIndex((task) => task.id === id)
      const task = state.tasks[index]
      if (task === undefined) return
      const target = index + by
      if (target < 0 || target >= state.tasks.length) return
      state.tasks.splice(index, 1)
      state.tasks.splice(target, 0, task)
    },
    remove(id: string) {
      const index = state.tasks.findIndex((task) => task.id === id)
      if (index < 0) return
      state.tasks.splice(index, 1)
      if (state.selected !== id) return
      // The next row takes the selection, or the previous one at the end.
      const next = state.tasks[index] ?? state.tasks[index - 1]
      state.selected = next?.id
    },
    step(key: string) {
      const index = state.visible.findIndex((task) => task.id === state.selected)
      const by = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0
      const task = state.visible[Math.max(0, Math.min(index + by, state.visible.length - 1))]
      if (task !== undefined) state.selected = task.id
    },
  })
  return (
    <MColumn gap="md">
      <MText variant="title">Inbox</MText>
      <MText tone="muted">{state.summary}</MText>
      <MRow gap="sm">
        <MInput
          label="New task"
          value={state.draft}
          onChange={(value) => (state.draft = value)}
          placeholder="Add a task"
          onSubmit={() => state.add()}
        />
        <MButton text="Add" onClick={() => state.add()} />
      </MRow>
      <MRow gap="sm">
        <MButton
          text="All"
          variant={state.filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => (state.filter = 'all')}
        />
        <MButton
          text="Open"
          variant={state.filter === 'open' ? 'primary' : 'secondary'}
          onClick={() => (state.filter = 'open')}
        />
        <MButton
          text="Finished"
          variant={state.filter === 'done' ? 'primary' : 'secondary'}
          onClick={() => (state.filter = 'done')}
        />
        <MButton
          text={state.sorted ? 'Keep my order' : 'Sort by title'}
          variant="secondary"
          onClick={() => (state.sorted = !state.sorted)}
        />
      </MRow>
      <MCheckbox
        label="Everything done"
        checked={state.tasks.length > 0 && state.done === state.tasks.length}
        indeterminate={state.done > 0 && state.done < state.tasks.length}
        onChange={(checked) => state.completeAll(checked)}
      />
      <MText>{state.selection}</MText>
      <Show when={state.tasks.length > 0} else={<MText tone="muted">No tasks yet</MText>}>
        <Show
          when={state.visible.length > 0}
          else={<MText tone="muted">Nothing matches this filter</MText>}
        >
          <MColumn gap="sm" padding="sm" label="Tasks" onKeyDown={(key) => state.step(key)}>
            <For each={state.visible}>
              {(task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  selected={task.id === state.selected}
                  onSelect={(id) => (state.selected = id)}
                  onToggle={(id) => state.toggle(id)}
                  onRename={(id, title) => state.rename(id, title)}
                  onInsert={(id) => state.insertAfter(id)}
                  onMove={(id, by) => state.move(id, by)}
                  onRemove={(id) => state.remove(id)}
                />
              )}
            </For>
          </MColumn>
        </Show>
      </Show>
    </MColumn>
  )
}
