<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MText } from '#mavis'
import type { Filter, Task } from './types'
import TaskRow from './TaskRow.vue'

const tasks = ref<Task[]>([
  { id: 'a', title: 'Write', done: false },
  { id: 'b', title: 'Review', done: true },
  { id: 'c', title: 'Ship', done: false },
])
const filter = ref<Filter>('all')
const next = ref(1)
const visible = computed(() =>
  tasks.value.filter((task) => filter.value === 'all' || (filter.value === 'done') === task.done),
)
const summary = computed(() => {
  const open = tasks.value.filter((task) => !task.done).length
  return `${open} open of ${tasks.value.length}; any done ${tasks.value.some((task) => task.done)}; all done ${tasks.value.every((task) => task.done)}`
})
const titles = computed(() =>
  tasks.value
    .map((task) => task.title)
    .slice(0, 2)
    .join(' + '),
)
const shipAt = computed(() => tasks.value.findIndex((task) => task.title === 'Ship'))

function toggle(id: string) {
  tasks.value = tasks.value.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
}
function add() {
  tasks.value.push({ id: `n${next.value}`, title: `New ${next.value}`, done: false })
  next.value++
}
function moveUp(id: string) {
  const index = tasks.value.findIndex((item) => item.id === id)
  const task = tasks.value.find((item) => item.id === id)
  if (task === undefined) return
  if (index <= 0) return
  tasks.value.splice(index, 1)
  tasks.value.splice(index - 1, 0, task)
}
function removeLast() {
  tasks.value.splice(-1, 1)
}
function appendFar() {
  tasks.value.splice(99, 0, { id: `far${next.value}`, title: 'Far', done: true })
  next.value++
}
</script>

<template>
  <MColumn gap="sm">
    <MText variant="heading">{{ summary }}</MText>
    <MText>Titles: {{ titles }}; Ship at {{ shipAt }}</MText>
    <template v-if="visible.length > 0">
      <TaskRow
        v-for="task in visible"
        :key="task.id"
        :task="task"
        @toggle="toggle"
        @move-up="moveUp"
      />
    </template>
    <MText v-else tone="muted">Nothing to show</MText>
    <MColumn gap="xs">
      <MButton text="All" variant="secondary" @click="filter = 'all'" />
      <MButton text="Open" variant="secondary" @click="filter = 'open'" />
      <MButton text="Done" variant="secondary" @click="filter = 'done'" />
      <MButton text="Add" @click="add" />
      <MButton text="Remove last" @click="removeLast" />
      <MButton text="Append far" @click="appendFar" />
    </MColumn>
  </MColumn>
</template>
