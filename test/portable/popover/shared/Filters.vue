<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  open: false as boolean,
  query: 'Mavis' as string,
  reason: 'none' as string,
})
</script>

<template>
  <MColumn padding="lg" gap="md">
    <MPopover
      :open="state.open"
      @update:open="(value) => (state.open = value)"
      label="Refine results"
      triggerLabel="Filters"
      placement="bottom-end"
      :width="320"
      @close="(next) => (state.reason = next)"
    >
      <MInput
        label="Search"
        :modelValue="state.query"
        @update:modelValue="(value) => (state.query = value)"
      />
      <MButton text="Apply filters" @click="() => (state.open = false)" />
    </MPopover>
    <MText>{{ state.query }}</MText>
    <MText>{{ `Closed: ${state.reason}` }}</MText>
  </MColumn>
</template>
