<script setup lang="ts">
import { type PropType } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  strong: { type: Boolean, required: false, default: undefined },
  count: { type: Number, required: false },
  onTap: { type: Function as PropType<(arg0: string) => void>, required: false },
})
</script>

<template>
  <MRow gap="sm">
    <MText :weight="(props.strong ?? false) ? 'bold' : 'normal'">{{
      `${props.label} ${props.count ?? 0}`
    }}</MText>
    <template v-if="props.strong === undefined">
      <MText tone="muted">plain</MText>
    </template>
    <MButton @click="() => props.onTap?.(props.label)" :text="`Tap ${props.label}`" />
  </MRow>
</template>
