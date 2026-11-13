import { useStore } from '@builder.io/mitosis'
import type { Task } from './types'
import Panel from './Panel.lite'
import TaskList from './TaskList.lite'

export default function Slots() {
  const state = useStore({
    count: 0,
    tasks: [
      { id: 'a', title: 'Write', done: false },
      { id: 'b', title: 'Ship', done: false },
    ] as Task[],
    finish(id: string) {
      state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: true } : task))
    },
  })
  return (
    <MColumn gap="md">
      <Panel name="plain" title="Plain panel" />
      <Panel
        name="custom"
        title="Unused"
        slotHeader={
          <MText id="custom-header" variant="heading">
            Custom header {state.count}
          </MText>
        }
      >
        <MText id="custom-body">Body {state.count}</MText>
        <MButton text="Count" onClick={() => state.count++} />
      </Panel>
      <Panel
        name="footer"
        title="With a footer"
        slotFooter={
          <MText id="footer-note" tone="muted">
            Footer note
          </MText>
        }
      >
        <MText id="footer-body">Only the body</MText>
      </Panel>
      <TaskList
        tasks={state.tasks}
        slotRow={({ task, position }) => (
          <>
            <MText>
              {position}. {task.title}
              {task.done ? ' (done)' : ''}
            </MText>
            <MButton
              text={`Finish ${task.title}`}
              variant="secondary"
              disabled={task.done}
              onClick={() => state.finish(task.id)}
            />
          </>
        )}
        slotEmpty={<MText>All cleared</MText>}
      />
      <TaskList tasks={state.tasks} />
      <MButton text="Clear" onClick={() => (state.tasks = [])} />
    </MColumn>
  )
}
