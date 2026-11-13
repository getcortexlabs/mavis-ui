<script setup lang="ts">
import { ref } from 'vue'
import { useUtilities } from './utilities'
import Scheduled from './Scheduled.vue'
const tools = useUtilities()
const shown = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MText>{{ tools.summary.value }}</MText>
    <MText
      >{{ tools.timer.value }}; completed {{ tools.completed.value }}; cancelled
      {{ tools.cancelled.value }}</MText
    >
    <MButton text="Use platform tools" @click="tools.demonstrate()" />
    <MButton text="Run short timer" @click="tools.run(25)" />
    <MButton text="Show scheduled child" @click="shown = true" />
    <MButton text="Hide scheduled child" @click="shown = false" />
    <Scheduled v-if="shown" />
  </MColumn>
</template>
