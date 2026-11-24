<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  split: 40 as number,
  settled: 0 as number,
})
</script>

<template>
  <MColumn gap="md">
    <MResizablePanels
      label="Workspace split"
      :modelValue="state.split"
      @update:modelValue="(value) => (state.split = value)"
      @resize="(value) => (state.settled = value)"
      :collapsible="true"
      :height="160"
    >
      <template #primary>
        <MText>Shelves</MText>
      </template>
      <template #secondary>
        <MText>Pages</MText>
      </template>
    </MResizablePanels>
    <MText>{{ `Split ${state.split}` }}</MText>
    <MText>{{ `Settled ${state.settled}` }}</MText>
  </MColumn>
</template>
