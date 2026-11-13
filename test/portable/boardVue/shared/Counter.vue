<script setup lang="ts">
import { MButton, MRow, MText } from '#mavis'

const props = withDefaults(
  defineProps<{ name: string; step?: number; note?: string; strong?: boolean }>(),
  { step: 1, note: '' },
)
const emit = defineEmits<{ add: [name: string, step: number]; clear: [] }>()
</script>

<template>
  <MRow gap="sm">
    <MText :weight="strong ? 'bold' : 'normal'"
      >{{ name }} +{{ props.step }}{{ note ? ` (${note})` : '' }}</MText
    >
    <MButton :text="`Add ${name}`" @click="emit('add', name, step)" />
    <MButton :text="`Clear ${name}`" variant="ghost" @click="$emit('clear')" />
  </MRow>
</template>
