<script setup lang="ts">
import { reactive } from 'vue'
import * as mavisCalendarTools from './shared/calendar-tools'

const state = reactive({
  date: '2024-01-31' as string,
  get summary(): string {
    return mavisCalendarTools.calendarSummary(state.date, 1)
  },
})
</script>

<template>
  <MColumn gap="md">
    <MText>{{ state.summary }}</MText>
    <MText>{{ mavisCalendarTools.leapSummary() }}</MText>
    <MText>{{ mavisCalendarTools.calendarSummary('0001-01-01', -1) }}</MText>
    <MText>{{ mavisCalendarTools.calendarSummary('9999-12-31', 1) }}</MText>
    <MText>{{ mavisCalendarTools.calendarSummary('2024-02-01', 0.5) }}</MText>
    <MButton text="Invalid date" @click="() => (state.date = '2023-02-29')" />
  </MColumn>
</template>
