<script setup lang="ts">
import { type PropType } from 'vue'
import type { Task } from './types'

const props = defineProps({
  task: { type: Object as PropType<Task>, required: true },
  selected: { type: Boolean, required: true },
  onSelect: { type: Function as PropType<(arg0: string) => void>, required: true },
  onToggle: { type: Function as PropType<(arg0: string) => void>, required: true },
  onRename: { type: Function as PropType<(arg0: string, arg1: string) => void>, required: true },
  onInsert: { type: Function as PropType<(arg0: string) => void>, required: true },
  onMove: { type: Function as PropType<(arg0: string, arg1: number) => void>, required: true },
  onRemove: { type: Function as PropType<(arg0: string) => void>, required: true },
})
</script>

<template>
  <MRow
    role="group"
    gap="sm"
    :accessibilityLabel="`Task ${props.task.number}: ${props.task.title}${props.selected ? ', selected' : ''}`"
  >
    <MCheckbox
      :label="`Task ${props.task.number} done`"
      :modelValue="props.task.done"
      @update:modelValue="() => props.onToggle(props.task.id)"
    />
    <MInput
      :label="`Task ${props.task.number} title`"
      :modelValue="props.task.title"
      @update:modelValue="(value) => props.onRename(props.task.id, value)"
      @submit="() => props.onInsert(props.task.id)"
    />
    <MText :tone="props.selected ? 'primary' : 'muted'">{{
      `${props.task.done ? 'Done' : 'Open'}${props.selected ? ' · selected' : ''}`
    }}</MText>
    <MButton
      :text="`Select task ${props.task.number}`"
      variant="secondary"
      @click="() => props.onSelect(props.task.id)"
    />
    <MButton
      :text="`Move task ${props.task.number} up`"
      variant="secondary"
      @click="() => props.onMove(props.task.id, -1)"
    />
    <MButton
      :text="`Move task ${props.task.number} down`"
      variant="secondary"
      @click="() => props.onMove(props.task.id, 1)"
    />
    <MButton
      :text="`Remove task ${props.task.number}`"
      variant="secondary"
      @click="() => props.onRemove(props.task.id)"
    />
  </MRow>
</template>
