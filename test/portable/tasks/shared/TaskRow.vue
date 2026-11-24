<script setup lang="ts">
import { type PropType } from 'vue'
import type { Task } from './types'

const props = defineProps({
  task: { type: Object as PropType<Task>, required: true },
  onToggle: { type: Function as PropType<(arg0: string) => void>, required: true },
  onMoveUp: { type: Function as PropType<(arg0: string) => void>, required: true },
})
</script>

<template>
  <MRow gap="sm">
    <MText :tone="props.task.done ? 'muted' : 'text'">{{
      props.task.done ? `✓ ${props.task.title}` : props.task.title
    }}</MText>
    <MButton :text="`Toggle ${props.task.title}`" @click="() => props.onToggle(props.task.id)" />
    <MButton
      :text="`Up ${props.task.title}`"
      variant="secondary"
      @click="() => props.onMoveUp(props.task.id)"
    />
  </MRow>
</template>
