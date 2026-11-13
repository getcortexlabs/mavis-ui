<script setup lang="ts">
import { ref, computed } from 'vue'
import { calendarSummary, leapSummary } from './calendar-tools'
const date = ref('2024-01-31')
const summary = computed(() => calendarSummary(date.value, 1))
</script>
<template>
  <MColumn gap="md">
    <MText>{{ summary }}</MText>
    <MText>{{ leapSummary() }}</MText>
    <MText>{{ calendarSummary('0001-01-01', -1) }}</MText>
    <MText>{{ calendarSummary('9999-12-31', 1) }}</MText>
    <MText>{{ calendarSummary('2024-02-01', 0.5) }}</MText>
    <MButton text="Invalid date" @click="date = '2023-02-29'" />
  </MColumn>
</template>
