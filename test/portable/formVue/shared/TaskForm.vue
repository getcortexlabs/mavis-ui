<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MCheckbox, MColumn, MInput, MRow, MSelect, MText } from '#mavis'
import type { ChoiceOption, InputHandle } from '#mavis'
import type { TaskDraft } from './types'

const titleRef = ref<InputHandle | null>(null)
const notesRef = ref<InputHandle | null>(null)
const saved = ref<TaskDraft>({ title: '', notes: '', priority: null, done: false })
const title = ref('')
const notes = ref('')
const priority = ref<string | null>(null)
const done = ref(false)
const owner = ref('Ana')
const submitted = ref(false)
const status = ref('Nothing saved yet')
const priorities: ChoiceOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent', disabled: true },
]

const titleError = computed(() => {
  const trimmed = title.value.trim()
  return !submitted.value
    ? ''
    : trimmed === ''
      ? 'Enter a title'
      : trimmed.length < 3
        ? 'Use at least 3 characters'
        : ''
})
const notesError = computed(() =>
  submitted.value && priority.value === 'high' && notes.value.trim() === ''
    ? 'Say why it is high priority'
    : '',
)
const priorityError = computed(() =>
  submitted.value && priority.value === null ? 'Choose a priority' : '',
)
const problems = computed(
  () =>
    [titleError.value, notesError.value, priorityError.value].filter((error) => error !== '')
      .length,
)
const changed = computed(
  () =>
    title.value !== saved.value.title ||
    notes.value !== saved.value.notes ||
    priority.value !== saved.value.priority ||
    done.value !== saved.value.done,
)

function save() {
  submitted.value = true
  if (titleError.value !== '') {
    titleRef.value?.focus()
    return
  }
  if (notesError.value !== '') {
    notesRef.value?.focus()
    return
  }
  if (priorityError.value !== '') return
  saved.value = {
    title: title.value.trim(),
    notes: notes.value,
    priority: priority.value,
    done: done.value,
  }
  title.value = saved.value.title
  submitted.value = false
  status.value = `Saved ${saved.value.title}${done.value ? ' (done)' : ''}`
}
function discard() {
  title.value = saved.value.title
  notes.value = saved.value.notes
  priority.value = saved.value.priority
  done.value = saved.value.done
  submitted.value = false
  titleRef.value?.blur()
}
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">Task</MText>
    <MText v-if="problems > 0" tone="danger">{{
      problems === 1 ? '1 field needs attention' : `${problems} fields need attention`
    }}</MText>
    <MInput
      id="title"
      ref="titleRef"
      v-model="title"
      label="Title"
      placeholder="What needs doing?"
      :maxLength="24"
      :error="titleError"
      @submit="save"
    />
    <MInput
      id="notes"
      ref="notesRef"
      v-model="notes"
      label="Notes"
      multiline
      :rows="3"
      helperText="Optional unless the priority is high"
      :error="notesError"
    />
    <MSelect
      id="priority"
      v-model="priority"
      label="Priority"
      :options="priorities"
      placeholder="Choose one"
      :error="priorityError"
    />
    <MCheckbox
      id="done"
      v-model="done"
      label="Done"
      helperText="Finished tasks move to the bottom"
    />
    <MInput v-model="owner" label="Created by" readonly />
    <MRow gap="sm">
      <MButton text="Save" @click="save" />
      <MButton text="Discard" variant="secondary" :disabled="!changed" @click="discard" />
    </MRow>
    <MText tone="muted">{{ changed ? 'Unsaved changes' : status }}</MText>
  </MColumn>
</template>
