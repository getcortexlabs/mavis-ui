import { useStore, Show, For } from '@builder.io/mitosis'
import type { Task, Filter } from './types'
import TaskRow from './TaskRow.lite'

export default function Tasks() {
  const state = useStore({
    tasks: [
      { id: 'a', title: 'Write', done: false },
      { id: 'b', title: 'Review', done: true },
      { id: 'c', title: 'Ship', done: false },
    ] as Task[],
    filter: 'all' as Filter,
    next: 1,
    get visible(): Task[] {
      return state.tasks.filter(
        (task) => state.filter === 'all' || (state.filter === 'done') === task.done,
      )
    },
    get summary(): string {
      const open = state.tasks.filter((task) => !task.done).length
      return `${open} open of ${state.tasks.length}; any done ${state.tasks.some((task) => task.done)}; all done ${state.tasks.every((task) => task.done)}`
    },
    get titles(): string {
      return state.tasks
        .map((task) => task.title)
        .slice(0, 2)
        .join(' + ')
    },
    get shipAt(): number {
      return state.tasks.findIndex((task) => task.title === 'Ship')
    },
    toggle(id: string) {
      state.tasks = state.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      )
    },
    add() {
      state.tasks.push({ id: `n${state.next}`, title: `New ${state.next}`, done: false })
      state.next++
    },
    moveUp(id: string) {
      const index = state.tasks.findIndex((item) => item.id === id)
      const task = state.tasks.find((item) => item.id === id)
      if (task === undefined) return
      if (index <= 0) return
      state.tasks.splice(index, 1)
      state.tasks.splice(index - 1, 0, task)
    },
    removeLast() {
      state.tasks.splice(-1, 1)
    },
    appendFar() {
      state.tasks.splice(99, 0, { id: `far${state.next}`, title: 'Far', done: true })
      state.next++
    },
  })
  return (
    <MColumn gap="sm">
      <MText variant="heading">{state.summary}</MText>
      <MText>
        Titles: {state.titles}; Ship at {state.shipAt}
      </MText>
      <Show when={state.visible.length > 0} else={<MText tone="muted">Nothing to show</MText>}>
        <For each={state.visible}>
          {(task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={(id) => state.toggle(id)}
              onMoveUp={(id) => state.moveUp(id)}
            />
          )}
        </For>
      </Show>
      <MColumn gap="xs">
        <MButton text="All" variant="secondary" onClick={() => (state.filter = 'all')} />
        <MButton text="Open" variant="secondary" onClick={() => (state.filter = 'open')} />
        <MButton text="Done" variant="secondary" onClick={() => (state.filter = 'done')} />
        <MButton text="Add" onClick={() => state.add()} />
        <MButton text="Remove last" onClick={() => state.removeLast()} />
        <MButton text="Append far" onClick={() => state.appendFar()} />
      </MColumn>
    </MColumn>
  )
}
