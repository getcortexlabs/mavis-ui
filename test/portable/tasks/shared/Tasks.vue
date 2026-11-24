<script setup lang="ts">
import { reactive } from 'vue'
import TaskRow from './TaskRow.vue'
import type { Task } from './types'
import { vMavisKeepFocus } from './runtime'

const state = reactive({
  tasks: [
    { id: 'a', title: 'Write', done: false },
    { id: 'b', title: 'Review', done: true },
    { id: 'c', title: 'Ship', done: false },
  ] as Task[],
  filter: 'all' as string,
  next: 1 as number,
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
  toggle(id: string): void {
    state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
  },
  add(): void {
    state.tasks.push({ id: `n${state.next}`, title: `New ${state.next}`, done: false })
    state.next += 1
  },
  moveUp(id: string): void {
    const index = state.tasks.findIndex((item) => item.id === id)
    const task = state.tasks.find((item) => item.id === id)
    if (task === undefined) return
    if (index <= 0) {
      return
    }
    state.tasks.splice(index, 1)
    state.tasks.splice(index - 1, 0, task)
  },
  removeLast(): void {
    state.tasks.splice(-1, 1)
  },
  appendFar(): void {
    state.tasks.splice(99, 0, { id: `far${state.next}`, title: 'Far', done: true })
    state.next += 1
  },
})
</script>

<template>
  <MColumn gap="sm" v-mavis-keep-focus>
    <MText variant="heading">{{ state.summary }}</MText>
    <MText>{{ `Titles: ${state.titles}; Ship at ${state.shipAt}` }}</MText>
    <template v-if="state.visible.length > 0">
      <template v-for="task in state.visible" :key="task.id">
        <TaskRow
          :task="task"
          :onToggle="(id) => state.toggle(id)"
          :onMoveUp="(id) => state.moveUp(id)"
        />
      </template>
    </template>
    <template v-else>
      <MText tone="muted">Nothing to show</MText>
    </template>
    <MColumn gap="xs">
      <MButton text="All" variant="secondary" @click="() => (state.filter = 'all')" />
      <MButton text="Open" variant="secondary" @click="() => (state.filter = 'open')" />
      <MButton text="Done" variant="secondary" @click="() => (state.filter = 'done')" />
      <MButton text="Add" @click="() => state.add()" />
      <MButton text="Remove last" @click="() => state.removeLast()" />
      <MButton text="Append far" @click="() => state.appendFar()" />
    </MColumn>
  </MColumn>
</template>
