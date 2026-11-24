<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  selected: '2024-02-28' as string,
  locked: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MCalendar
      label="Choose a day"
      :modelValue="state.selected"
      @update:modelValue="(value) => (state.selected = value)"
      min="2024-02-01"
      max="2024-03-31"
      :unavailableDates="['2024-02-29']"
      initialMonth="2024-02"
      :disabled="state.locked"
    />
    <MText>{{ `Selected: ${state.selected}` }}</MText>
    <MButton
      :text="state.locked ? 'Unlock' : 'Lock'"
      @click="() => (state.locked = !state.locked)"
    />
  </MColumn>
</template>
