<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import * as mavisUtilities from './shared/utilities'

const tools = mavisUtilities.useUtilities()
onMounted(async () => {
  await tools.run(10000)
})
onUnmounted(() => {
  tools.cancel()
})
</script>

<template>
  <MText>Scheduled child</MText>
</template>
