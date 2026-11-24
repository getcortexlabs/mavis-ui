<script setup lang="ts">
import { reactive } from 'vue'
import Panel from './Panel.vue'
import TaskList from './TaskList.vue'
import type { Task } from './types'

const state = reactive({
  count: 0 as number,
  tasks: [
    { id: 'a', title: 'Write', done: false },
    { id: 'b', title: 'Ship', done: false },
  ] as Task[],
  finish(id: string): void {
    state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: true } : task))
  },
})
</script>

<template>
  <MColumn gap="md">
    <Panel :name="'plain'" :title="'Plain panel'" />
    <Panel :name="'custom'" :title="'Unused'">
      <template #header>
        <MText id="custom-header" variant="heading">{{ `Custom header ${state.count}` }}</MText>
      </template>
      <template #default>
        <MText id="custom-body">{{ `Body ${state.count}` }}</MText>
        <MButton text="Count" @click="() => (state.count += 1)" />
      </template>
    </Panel>
    <Panel :name="'footer'" :title="'With a footer'">
      <template #footer>
        <MText id="footer-note" tone="muted">Footer note</MText>
      </template>
      <template #default>
        <MText id="footer-body">Only the body</MText>
      </template>
    </Panel>
    <TaskList :tasks="state.tasks">
      <template #row="{ task, position }">
        <MText>{{ `${position}. ${task.title}${task.done ? ' (done)' : ''}` }}</MText>
        <MButton
          :text="`Finish ${task.title}`"
          variant="secondary"
          :disabled="task.done"
          @click="() => state.finish(task.id)"
        />
      </template>
      <template #empty>
        <MText>All cleared</MText>
      </template>
    </TaskList>
    <TaskList :tasks="state.tasks" />
    <MButton text="Clear" @click="() => (state.tasks = [])" />
  </MColumn>
</template>
