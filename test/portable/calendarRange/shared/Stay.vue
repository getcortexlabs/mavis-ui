<script setup lang="ts">
import { reactive } from 'vue'
import type { DateRange } from './types'

const state = reactive({
  range: { start: '2024-02-01', end: undefined } as DateRange,
  errors: 0 as number,
})
</script>

<template>
  <MCalendar
    label="Stay"
    mode="range"
    :modelValue="{ start: state.range.start ?? null, end: state.range.end ?? null }"
    @update:modelValue="
      (value) =>
        ((value) => (state.range = value))({
          start: value.start ?? undefined,
          end: value.end ?? undefined,
        })
    "
    @invalid="() => (state.errors += 1)"
    initialMonth="2024-02"
    :unavailableDates="['2024-02-03']"
  >
    <template #footer>
      <MColumn>
        <MText>{{ `Range: ${state.range.start ?? 'none'} to ${state.range.end ?? 'none'}` }}</MText>
        <MText>{{ `Errors: ${state.errors}` }}</MText>
      </MColumn>
    </template>
  </MCalendar>
</template>
