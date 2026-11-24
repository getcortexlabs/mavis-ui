<script setup lang="ts">
import { type PropType } from 'vue'
import type { Task } from './types'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const props = defineProps({
  task: { type: Object as PropType<Task>, required: true },
  selected: { type: Boolean, required: true },
  onSelect: { type: Function as PropType<(arg0: string) => void>, required: true },
})
const { theme: mavisTheme } = useMavisTheme()
</script>

<template>
  <MCard
    gap="xs"
    padding="md"
    :backgroundColor="
      mavisTheme.colors[
        (props.selected ? 'primarySoft' : 'surface') as keyof typeof mavisTheme.colors
      ]
    "
    :accessibilityLabel="`${props.task.title}, ${props.task.done ? 'done' : 'open'}, ${props.task.priority} priority${props.selected ? ', selected' : ''}`"
    interactive
    @click="() => props.onSelect(props.task.id)"
  >
    <MText :tone="props.task.done ? 'muted' : 'text'">{{ props.task.title }}</MText>
    <MText variant="caption" tone="muted">{{
      props.task.priority === 'high'
        ? 'High priority'
        : props.task.priority === 'low'
          ? 'Low priority'
          : 'Normal priority'
    }}</MText>
    <MReveal :show="props.task.done" gap="xs">
      <MText variant="caption" tone="success">Done</MText>
    </MReveal>
  </MCard>
</template>
