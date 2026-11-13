<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
const query = ref('Mavis')
const reason = ref('none')
</script>

<template>
  <MColumn padding="lg" gap="md">
    <MPopover
      v-model:open="open"
      label="Refine results"
      trigger-label="Filters"
      placement="bottom-end"
      :width="320"
      @close="(next) => (reason = next)"
    >
      <MInput v-model="query" label="Search" />
      <MButton text="Apply filters" @click="open = false" />
    </MPopover>
    <MText>{{ query }}</MText>
    <MText>Closed: {{ reason }}</MText>
  </MColumn>
</template>
