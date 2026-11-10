import { useStore, useRef, Show } from '@builder.io/mitosis'
import type { TaskDraft } from './types'

export default function TaskForm() {
  const titleRef = useRef<MavisFieldRef>(null)
  const notesRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    saved: { title: '', notes: '', priority: undefined, done: false } as TaskDraft,
    title: '',
    notes: '',
    priority: undefined as string | undefined,
    done: false,
    owner: 'Ana',
    submitted: false,
    status: 'Nothing saved yet',
    priorities: [
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent', disabled: true },
    ] as SelectOption[],
    get titleError(): string {
      const title = state.title.trim()
      return !state.submitted
        ? ''
        : title === ''
          ? 'Enter a title'
          : title.length < 3
            ? 'Use at least 3 characters'
            : ''
    },
    get notesError(): string {
      return state.submitted && state.priority === 'high' && state.notes.trim() === ''
        ? 'Say why it is high priority'
        : ''
    },
    get priorityError(): string {
      return state.submitted && state.priority === undefined ? 'Choose a priority' : ''
    },
    get problems(): number {
      return [state.titleError, state.notesError, state.priorityError].filter(
        (error) => error !== '',
      ).length
    },
    get changed(): boolean {
      return (
        state.title !== state.saved.title ||
        state.notes !== state.saved.notes ||
        state.priority !== state.saved.priority ||
        state.done !== state.saved.done
      )
    },
    save() {
      state.submitted = true
      if (state.titleError !== '') {
        titleRef.focus()
        return
      }
      if (state.notesError !== '') {
        notesRef.focus()
        return
      }
      if (state.priorityError !== '') return
      state.saved = {
        title: state.title.trim(),
        notes: state.notes,
        priority: state.priority,
        done: state.done,
      }
      state.title = state.saved.title
      state.submitted = false
      state.status = `Saved ${state.saved.title}${state.done ? ' (done)' : ''}`
    },
    discard() {
      state.title = state.saved.title
      state.notes = state.saved.notes
      state.priority = state.saved.priority
      state.done = state.saved.done
      state.submitted = false
      titleRef.blur()
    },
  })
  return (
    <MColumn gap="md">
      <MText variant="title">Task</MText>
      <Show when={state.problems > 0}>
        <MText tone="danger">
          {state.problems === 1
            ? '1 field needs attention'
            : `${state.problems} fields need attention`}
        </MText>
      </Show>
      <MInput
        label="Title"
        ref={titleRef}
        value={state.title}
        onChange={(value) => (state.title = value)}
        placeholder="What needs doing?"
        maxLength={24}
        error={state.titleError}
        onSubmit={() => state.save()}
        onEscape={() => state.discard()}
      />
      <MInput
        label="Notes"
        ref={notesRef}
        multiline
        rows={3}
        value={state.notes}
        onChange={(value) => (state.notes = value)}
        helperText="Optional unless the priority is high"
        error={state.notesError}
        onEscape={() => state.discard()}
      />
      <MSelect
        label="Priority"
        value={state.priority}
        options={state.priorities}
        onChange={(value) => (state.priority = value)}
        placeholder="Choose one"
        error={state.priorityError}
      />
      <MCheckbox
        label="Done"
        checked={state.done}
        onChange={(checked) => (state.done = checked)}
        helperText="Finished tasks move to the bottom"
      />
      <MInput
        label="Created by"
        value={state.owner}
        onChange={(value) => (state.owner = value)}
        readonly
      />
      <MRow gap="sm">
        <MButton text="Save" onClick={() => state.save()} />
        <MButton
          text="Discard"
          variant="secondary"
          disabled={!state.changed}
          onClick={() => state.discard()}
        />
      </MRow>
      <MText tone="muted">{state.changed ? 'Unsaved changes' : state.status}</MText>
    </MColumn>
  )
}
