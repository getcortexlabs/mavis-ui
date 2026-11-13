<script setup lang="ts">
import { ref } from 'vue'
import type { DateRange } from '#mavis'
const range = ref<DateRange>({ start: '2024-02-01', end: null })
const errors = ref(0)
</script>
<template>
  <MCalendar
    label="Stay"
    mode="range"
    v-model="range"
    @invalid="errors++"
    initialMonth="2024-02"
    :unavailableDates="['2024-02-03']"
    ><template #footer
      ><MColumn
        ><MText>{{ `Range: ${range.start ?? 'none'} to ${range.end ?? 'none'}` }}</MText
        ><MText>{{ `Errors: ${errors}` }}</MText></MColumn
      ></template
    ></MCalendar
  >
</template>
