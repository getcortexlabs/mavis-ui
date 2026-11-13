<script setup lang="ts">
import { ref } from 'vue'
import type { DateRange } from '#mavis'
const range = ref<DateRange>({ start: '2024-02-01', end: '2024-02-02' })
const reason = ref('none')
</script>
<template>
  <MColumn gap="md"
    ><MDateRangePicker
      label="Trip"
      v-model="range"
      @validityChange="(value) => (reason = value.reason ?? 'valid')"
      startLabel="Arrival"
      endLabel="Departure"
      initialMonth="2024-02"
      :unavailableDates="['2024-02-03']"
    /><MText>{{ `Range: ${range.start ?? 'none'} to ${range.end ?? 'none'}` }}</MText
    ><MText>{{ `Reason: ${reason}` }}</MText></MColumn
  >
</template>
