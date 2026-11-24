<script setup lang="ts">
import { reactive, ref } from 'vue'
import TaskDetail from './TaskDetail.vue'
import TaskRow from './TaskRow.vue'
import type { PriorityOption, Task } from './types'
import { mavisKey, useMavisShortcuts, vMavisKeepFocus } from './runtime'
import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'

const titleRef = ref<{ focus(): void; blur(): void }>()
const state = reactive({
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
  ] as PriorityOption[],
  filter: 'all' as string,
  selected: 'task1' as string | undefined,
  count: 3 as number,
  title: '' as string,
  notes: '' as string,
  priority: 'normal' as string,
  submitted: false as boolean,
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
  compose(): void {
    titleRef.value?.focus()
  },
  add(): void {
    state.submitted = true
    if (state.titleError !== '') {
      titleRef.value?.focus()
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
    if (state.filter === 'done') {
      state.filter = 'all'
    }
    state.title = ''
    state.notes = ''
    state.priority = 'normal'
    state.submitted = false
  },
  toggle(): void {
    state.tasks = state.tasks.map((task) =>
      task.id === state.selected ? { ...task, done: !task.done } : task,
    )
  },
  rename(title: string): void {
    state.tasks = state.tasks.map((task) =>
      task.id === state.selected ? { ...task, title: title } : task,
    )
  },
  annotate(notes: string): void {
    state.tasks = state.tasks.map((task) =>
      task.id === state.selected ? { ...task, notes: notes } : task,
    )
  },
  prioritize(priority: string): void {
    state.tasks = state.tasks.map((task) =>
      task.id === state.selected ? { ...task, priority: priority } : task,
    )
  },
  move(by: number): void {
    const task = state.visible[state.position]
    const other = state.visible[state.position + by]
    if (task === undefined) return
    if (other === undefined) return
    const from = state.tasks.findIndex((item) => item.id === task.id)
    const to = state.tasks.findIndex((item) => item.id === other.id)
    state.tasks.splice(from, 1)
    state.tasks.splice(to, 0, task)
  },
  remove(): void {
    const index = state.tasks.findIndex((task) => task.id === state.selected)
    if (index < 0) {
      return
    }
    const next = state.visible[state.position + 1] ?? state.visible[state.position - 1]
    state.tasks.splice(index, 1)
    state.selected = next?.id
  },
  step(key: string): void {
    const by = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0
    const task = state.visible[Math.max(0, Math.min(state.position + by, state.visible.length - 1))]
    if (task !== undefined) {
      state.selected = task.id
    }
  },
})
useMavisShortcuts([
  { key: 'k', run: () => state.compose() },
  { key: 'Enter', disabled: () => !state.hasCurrent, run: () => state.toggle() },
  { key: 'd', disabled: () => !state.hasCurrent, run: () => state.remove() },
])
const mavisRows1 = useComponentLayout(() => state.visible.map((task) => task.id))
</script>

<template>
  <MColumn gap="lg">
    <MColumn gap="xs">
      <MText variant="title">Tasks</MText>
      <MText tone="muted">{{ state.summary }}</MText>
    </MColumn>
    <MRow gap="sm">
      <MButton text="New task" @click="() => state.compose()" />
      <MButton
        :text="state.current.done ? 'Reopen' : 'Complete'"
        variant="secondary"
        :disabled="!state.hasCurrent"
        @click="() => state.toggle()"
      />
      <MButton
        text="Delete"
        variant="secondary"
        :disabled="!state.hasCurrent"
        @click="() => state.remove()"
      />
    </MRow>
    <MGrid gap="lg" :columns="2" :minColumnWidth="320">
      <MColumn gap="md">
        <MRow gap="sm">
          <MButton
            :text="`All (${state.tasks.length})`"
            :variant="state.filter === 'all' ? 'primary' : 'secondary'"
            @click="() => (state.filter = 'all')"
          />
          <MButton
            :text="`Open (${state.tasks.length - state.done})`"
            :variant="state.filter === 'open' ? 'primary' : 'secondary'"
            @click="() => (state.filter = 'open')"
          />
          <MButton
            :text="`Done (${state.done})`"
            :variant="state.filter === 'done' ? 'primary' : 'secondary'"
            @click="() => (state.filter = 'done')"
          />
        </MRow>
        <template v-if="state.tasks.length > 0">
          <template v-if="state.visible.length > 0">
            <MColumn
              role="group"
              gap="sm"
              accessibilityLabel="Tasks"
              tabindex="0"
              @keydown="(event: KeyboardEvent) => mavisKey(event, (key) => state.step(key))"
              :motionRegion="mavisRows1"
              v-mavis-keep-focus
            >
              <template v-for="task in state.visible" :key="task.id">
                <TaskRow
                  :task="task"
                  :selected="task.id === state.selected"
                  :onSelect="(id) => (state.selected = id)"
                />
              </template>
            </MColumn>
          </template>
          <template v-else>
            <MText tone="muted">Nothing here. Try another filter.</MText>
          </template>
        </template>
        <template v-else>
          <MText tone="muted">No tasks yet. Add the first one.</MText>
        </template>
      </MColumn>
      <MColumn gap="lg">
        <template v-if="state.hasCurrent">
          <TaskDetail
            :task="state.current"
            :priorities="state.priorities"
            :canMoveUp="state.position > 0"
            :canMoveDown="state.position >= 0 && state.position < state.visible.length - 1"
            :onToggle="() => state.toggle()"
            :onRename="(title) => state.rename(title)"
            :onNotes="(notes) => state.annotate(notes)"
            :onPriority="(priority) => state.prioritize(priority)"
            :onMove="(by) => state.move(by)"
          />
        </template>
        <template v-else>
          <MText tone="muted">Select a task to see its details.</MText>
        </template>
        <MCard gap="md">
          <MText variant="overline" tone="muted">NEW TASK</MText>
          <MInput
            label="Title"
            ref="titleRef"
            :modelValue="state.title"
            @update:modelValue="(value) => (state.title = value)"
            placeholder="What needs doing?"
            :maxLength="60"
            :error="state.titleError"
            @submit="() => state.add()"
          />
          <MInput
            label="Notes"
            :multiline="true"
            :rows="2"
            :modelValue="state.notes"
            @update:modelValue="(value) => (state.notes = value)"
          />
          <MSelect
            label="Priority"
            :modelValue="state.priority ?? null"
            :options="state.priorities"
            @update:modelValue="
              (choice: string | number) => {
                if (typeof choice === 'string') ((value) => (state.priority = value))(choice)
              }
            "
          />
          <MRow gap="sm">
            <MButton text="Add task" @click="() => state.add()" />
          </MRow>
        </MCard>
      </MColumn>
    </MGrid>
  </MColumn>
</template>
