<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MText } from '#mavis'
import type { Task } from './types'
import Panel from './Panel.vue'
import TaskList from './TaskList.vue'

const count = ref(0)
const tasks = ref<Task[]>([
  { id: 'a', title: 'Write', done: false },
  { id: 'b', title: 'Ship', done: false },
])

function finish(id: string) {
  tasks.value = tasks.value.map((task) => (task.id === id ? { ...task, done: true } : task))
}
</script>

<template>
  <MColumn gap="md">
    <Panel name="plain" title="Plain panel" />
    <Panel name="custom" title="Unused">
      <template #header>
        <MText id="custom-header" variant="heading">Custom header {{ count }}</MText>
      </template>
      <MText id="custom-body">Body {{ count }}</MText>
      <MButton text="Count" @click="count++" />
    </Panel>
    <Panel name="footer" title="With a footer">
      <MText id="footer-body">Only the body</MText>
      <template v-slot:footer>
        <MText id="footer-note" tone="muted">Footer note</MText>
      </template>
    </Panel>
    <TaskList :tasks="tasks">
      <template #row="{ task, position }">
        <MText>{{ position }}. {{ task.title }}{{ task.done ? ' (done)' : '' }}</MText>
        <MButton
          :text="`Finish ${task.title}`"
          variant="secondary"
          :disabled="task.done"
          @click="finish(task.id)"
        />
      </template>
      <template #empty><MText>All cleared</MText></template>
    </TaskList>
    <TaskList :tasks="tasks" />
    <MButton text="Clear" @click="tasks = []" />
  </MColumn>
</template>
