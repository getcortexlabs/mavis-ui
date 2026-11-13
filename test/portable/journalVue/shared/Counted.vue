<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { MText } from '#mavis'

defineProps<{ label: string }>()
const emit = defineEmits<{ shown: []; hidden: [] }>()

onMounted(() => emit('shown'))
onUnmounted(() => {
  emit('hidden')
})
</script>

<template>
  <MText tone="muted">{{ label }}</MText>
</template>
