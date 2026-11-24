<script setup lang="ts">
import { type PropType } from 'vue'
import type { Task } from './types'
import { vMavisKeepFocus } from './runtime'

const props = defineProps({
  tasks: { type: Array as PropType<Task[]>, required: true },
})
defineSlots<{
  row?: (props: { task: Task; position: number }) => unknown
  empty?: () => unknown
}>()
</script>

<template>
  <MColumn gap="xs" v-mavis-keep-focus>
    <template v-for="(task, index) in props.tasks" :key="task.id">
      <MRow gap="sm">
        <slot name="row" :task="task" :position="index + 1">
          <MText>{{ task.title }}</MText>
        </slot>
      </MRow>
    </template>
    <template v-if="props.tasks.length === 0">
      <slot name="empty">
        <MText tone="muted">No tasks</MText>
      </slot>
    </template>
  </MColumn>
</template>
