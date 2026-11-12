<script setup lang="ts">
import { MColumn, MRow, MText } from '#mavis'
import type { Task } from './types'

defineProps<{ tasks: Task[] }>()
defineSlots<{
  row?(props: { task: Task; position: number }): unknown
  empty?(): unknown
}>()
</script>

<template>
  <MColumn gap="xs">
    <MRow v-for="(task, index) in tasks" :key="task.id" gap="sm">
      <slot name="row" :task="task" :position="index + 1">
        <MText>{{ task.title }}</MText>
      </slot>
    </MRow>
    <slot v-if="tasks.length === 0" name="empty">
      <MText tone="muted">No tasks</MText>
    </slot>
  </MColumn>
</template>
