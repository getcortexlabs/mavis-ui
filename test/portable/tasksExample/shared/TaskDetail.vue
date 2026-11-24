<script setup lang="ts">
import { type PropType } from 'vue'
import type { PriorityOption, Task } from './types'

const props = defineProps({
  task: { type: Object as PropType<Task>, required: true },
  priorities: { type: Array as PropType<PriorityOption[]>, required: true },
  canMoveUp: { type: Boolean, required: true },
  canMoveDown: { type: Boolean, required: true },
  onToggle: { type: Function as PropType<() => void>, required: true },
  onRename: { type: Function as PropType<(arg0: string) => void>, required: true },
  onNotes: { type: Function as PropType<(arg0: string) => void>, required: true },
  onPriority: { type: Function as PropType<(arg0: string) => void>, required: true },
  onMove: { type: Function as PropType<(arg0: number) => void>, required: true },
})
</script>

<template>
  <MCard gap="md">
    <MText variant="overline" tone="muted">SELECTED TASK</MText>
    <MCheckbox
      label="Done"
      :modelValue="props.task.done"
      @update:modelValue="() => props.onToggle()"
    />
    <MInput
      label="Task title"
      :modelValue="props.task.title"
      @update:modelValue="(value) => props.onRename(value)"
      :maxLength="60"
    />
    <MInput
      label="Task notes"
      :multiline="true"
      :rows="3"
      :modelValue="props.task.notes"
      @update:modelValue="(value) => props.onNotes(value)"
      placeholder="Anything worth remembering"
    />
    <MSelect
      label="Task priority"
      :modelValue="props.task.priority ?? null"
      :options="props.priorities"
      @update:modelValue="
        (choice: string | number) => {
          if (typeof choice === 'string') ((value) => props.onPriority(value))(choice)
        }
      "
    />
    <MRow gap="sm">
      <MButton
        text="Move up"
        variant="secondary"
        :disabled="!props.canMoveUp"
        @click="() => props.onMove(-1)"
      />
      <MButton
        text="Move down"
        variant="secondary"
        :disabled="!props.canMoveDown"
        @click="() => props.onMove(1)"
      />
    </MRow>
  </MCard>
</template>
