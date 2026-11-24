<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { SelectOption, TaskDraft } from './types'

const titleRef = ref<{ focus(): void; blur(): void }>()
const notesRef = ref<{ focus(): void; blur(): void }>()
const state = reactive({
  saved: { title: '', notes: '', priority: undefined, done: false } as TaskDraft,
  title: '' as string,
  notes: '' as string,
  priority: undefined as string | number | undefined,
  done: false as boolean,
  owner: 'Ana' as string,
  submitted: false as boolean,
  status: 'Nothing saved yet' as string,
  priorities: [
    { value: 'low', label: 'Low', helperText: undefined, disabled: undefined },
    { value: 'normal', label: 'Normal', helperText: undefined, disabled: undefined },
    { value: 'high', label: 'High', helperText: undefined, disabled: undefined },
    { value: 'urgent', label: 'Urgent', disabled: true, helperText: undefined },
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
    return [state.titleError, state.notesError, state.priorityError].filter((error) => error !== '')
      .length
  },
  get changed(): boolean {
    return (
      state.title !== state.saved.title ||
      state.notes !== state.saved.notes ||
      state.priority !== state.saved.priority ||
      state.done !== state.saved.done
    )
  },
  save(): void {
    state.submitted = true
    if (state.titleError !== '') {
      titleRef.value?.focus()
      return
    }
    if (state.notesError !== '') {
      notesRef.value?.focus()
      return
    }
    if (state.priorityError !== '') {
      return
    }
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
  discard(): void {
    state.title = state.saved.title
    state.notes = state.saved.notes
    state.priority = state.saved.priority
    state.done = state.saved.done
    state.submitted = false
    titleRef.value?.blur()
  },
})
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">Task</MText>
    <template v-if="state.problems > 0">
      <MText tone="danger">{{
        state.problems === 1 ? '1 field needs attention' : `${state.problems} fields need attention`
      }}</MText>
    </template>
    <MInput
      id="title"
      label="Title"
      ref="titleRef"
      :modelValue="state.title"
      @update:modelValue="(value) => (state.title = value)"
      placeholder="What needs doing?"
      :maxLength="24"
      :error="state.titleError"
      @submit="() => state.save()"
      @keydown.esc="() => state.discard()"
    />
    <MInput
      id="notes"
      label="Notes"
      ref="notesRef"
      :multiline="true"
      :rows="3"
      :modelValue="state.notes"
      @update:modelValue="(value) => (state.notes = value)"
      helperText="Optional unless the priority is high"
      :error="state.notesError"
      @keydown.esc="() => state.discard()"
    />
    <MSelect
      id="priority"
      label="Priority"
      :modelValue="state.priority ?? null"
      :options="state.priorities"
      @update:modelValue="
        (choice: string | number) => {
          ;((value) => (state.priority = value))(choice)
        }
      "
      placeholder="Choose one"
      :error="state.priorityError"
    />
    <MCheckbox
      id="done"
      label="Done"
      :modelValue="state.done"
      @update:modelValue="(checked) => (state.done = checked)"
      helperText="Finished tasks move to the bottom"
    />
    <MInput
      label="Created by"
      :modelValue="state.owner"
      @update:modelValue="(value) => (state.owner = value)"
      :readonly="true"
    />
    <MRow gap="sm">
      <MButton text="Save" @click="() => state.save()" />
      <MButton
        text="Discard"
        variant="secondary"
        :disabled="!state.changed"
        @click="() => state.discard()"
      />
    </MRow>
    <MText tone="muted">{{ state.changed ? 'Unsaved changes' : state.status }}</MText>
  </MColumn>
</template>
