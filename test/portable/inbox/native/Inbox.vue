<script setup lang="ts">
import { reactive } from 'vue'
import TaskItem from './TaskItem.vue'
import type { Task } from './types'
import { vMavisKeepFocus } from './runtime'

const state = reactive({
  tasks: [
    { id: 'write', number: 1, title: 'Write notes', done: false },
    { id: 'review', number: 2, title: 'Review copy', done: true },
    { id: 'ship', number: 3, title: 'Ship build', done: false },
  ] as Task[],
  filter: 'all' as string,
  sorted: false as boolean,
  selected: 'write' as string | undefined,
  draft: '' as string,
  count: 3 as number,
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
  add(): void {
    const title = state.draft.trim()
    if (title === '') {
      return
    }
    state.count += 1
    state.tasks.unshift({
      id: `task${state.count}`,
      number: state.count,
      title: title,
      done: false,
    })
    state.draft = ''
  },
  insertAfter(id: string): void {
    const index = state.tasks.findIndex((task) => task.id === id)
    if (index < 0) {
      return
    }
    state.count += 1
    state.tasks.splice(index + 1, 0, {
      id: `task${state.count}`,
      number: state.count,
      title: 'New task',
      done: false,
    })
  },
  toggle(id: string): void {
    state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
  },
  rename(id: string, title: string): void {
    state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, title: title } : task))
  },
  completeAll(done: boolean): void {
    state.tasks = state.tasks.map((task) => ({ ...task, done: done }))
  },
  move(id: string, by: number): void {
    const index = state.tasks.findIndex((task) => task.id === id)
    const task = state.tasks[index]
    if (task === undefined) return
    const target = index + by
    if (target < 0 || target >= state.tasks.length) {
      return
    }
    state.tasks.splice(index, 1)
    state.tasks.splice(target, 0, task)
  },
  remove(id: string): void {
    const index = state.tasks.findIndex((task) => task.id === id)
    if (index < 0) {
      return
    }
    state.tasks.splice(index, 1)
    if (state.selected !== id) {
      return
    }
    const next = state.tasks[index] ?? state.tasks[index - 1]
    state.selected = next?.id
  },
  step(key: string): void {
    const index = state.visible.findIndex((task) => task.id === state.selected)
    const by = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0
    const task = state.visible[Math.max(0, Math.min(index + by, state.visible.length - 1))]
    if (task !== undefined) {
      state.selected = task.id
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">Inbox</MText>
    <MText tone="muted">{{ state.summary }}</MText>
    <MRow gap="sm">
      <MInput
        label="New task"
        :modelValue="state.draft"
        @update:modelValue="(value) => (state.draft = value)"
        placeholder="Add a task"
        @submit="() => state.add()"
      />
      <MButton text="Add" @click="() => state.add()" />
    </MRow>
    <MRow gap="sm">
      <MButton
        text="All"
        :variant="state.filter === 'all' ? 'primary' : 'secondary'"
        @click="() => (state.filter = 'all')"
      />
      <MButton
        text="Open"
        :variant="state.filter === 'open' ? 'primary' : 'secondary'"
        @click="() => (state.filter = 'open')"
      />
      <MButton
        text="Finished"
        :variant="state.filter === 'done' ? 'primary' : 'secondary'"
        @click="() => (state.filter = 'done')"
      />
      <MButton
        :text="state.sorted ? 'Keep my order' : 'Sort by title'"
        variant="secondary"
        @click="() => (state.sorted = !state.sorted)"
      />
    </MRow>
    <MCheckbox
      label="Everything done"
      :modelValue="state.tasks.length > 0 && state.done === state.tasks.length"
      :indeterminate="state.done > 0 && state.done < state.tasks.length"
      @update:modelValue="(checked) => state.completeAll(checked)"
    />
    <MText>{{ state.selection }}</MText>
    <template v-if="state.tasks.length > 0">
      <template v-if="state.visible.length > 0">
        <MColumn gap="sm" padding="sm" accessibilityLabel="Tasks" v-mavis-keep-focus>
          <template v-for="task in state.visible" :key="task.id">
            <TaskItem
              :task="task"
              :selected="task.id === state.selected"
              :onSelect="(id) => (state.selected = id)"
              :onToggle="(id) => state.toggle(id)"
              :onRename="(id, title) => state.rename(id, title)"
              :onInsert="(id) => state.insertAfter(id)"
              :onMove="(id, by) => state.move(id, by)"
              :onRemove="(id) => state.remove(id)"
            />
          </template>
        </MColumn>
      </template>
      <template v-else>
        <MText tone="muted">Nothing matches this filter</MText>
      </template>
    </template>
    <template v-else>
      <MText tone="muted">No tasks yet</MText>
    </template>
  </MColumn>
</template>
