<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useWork } from './work'
const work = useWork()
const active = ref(true)
const emit = defineEmits<{ complete: []; disposed: [] }>()
onMounted(async () => {
  await work.load()
  if (active.value) emit('complete')
})
onUnmounted(() => {
  active.value = false
  work.cancel()
  emit('disposed')
})
</script>
<template><MText>Working child</MText></template>
