<script setup lang="ts">
import { reactive } from 'vue'
import type { DateRange } from './types'

const state = reactive({
  range: { start: '2024-02-01', end: '2024-02-02' } as DateRange,
  reason: 'none' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MDateRangePicker
      label="Trip"
      :modelValue="{ start: state.range.start ?? null, end: state.range.end ?? null }"
      @update:modelValue="
        (value) =>
          ((value) => (state.range = value))({
            start: value.start ?? undefined,
            end: value.end ?? undefined,
          })
      "
      @validityChange="
        (value) =>
          ((value) => (state.reason = value.reason ?? 'valid'))({
            ...value,
            reason: value.reason ?? undefined,
          })
      "
      startLabel="Arrival"
      endLabel="Departure"
      initialMonth="2024-02"
      :unavailableDates="['2024-02-03']"
    />
    <MText>{{ `Range: ${state.range.start ?? 'none'} to ${state.range.end ?? 'none'}` }}</MText>
    <MText>{{ `Reason: ${state.reason}` }}</MText>
  </MColumn>
</template>
