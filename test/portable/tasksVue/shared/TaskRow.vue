<script setup lang="ts">
import { MButton, MRow, MText } from '#mavis'
import type { Task } from './types'

defineProps<{ task: Task }>()
const emit = defineEmits<{ toggle: [id: string]; moveUp: [id: string] }>()
</script>

<template>
  <MRow gap="sm">
    <MText :tone="task.done ? 'muted' : 'text'">{{
      task.done ? `✓ ${task.title}` : task.title
    }}</MText>
    <MButton :text="`Toggle ${task.title}`" @click="emit('toggle', task.id)" />
    <MButton :text="`Up ${task.title}`" variant="secondary" @click="emit('moveUp', task.id)" />
  </MRow>
</template>
