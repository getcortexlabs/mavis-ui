<script setup lang="ts">
import { reactive } from 'vue'
import type { Session } from './types'

const state = reactive({
  events: [
    {
      id: 'design',
      title: 'Design',
      start: 1772895600000,
      end: 1772902800000,
      note: 'Keep metadata',
    },
  ] as Session[],
  date: '2026-03-07' as string,
  last: 'none' as string,
  selected: 'none' as string,
  error: '' as string,
  disabled: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MScheduler
      label="Studio schedule"
      :modelValue="state.events"
      @update:modelValue="(value) => (state.events = value)"
      :date="state.date"
      @update:date="(value) => (state.date = value)"
      timeZone="America/New_York"
      :days="1"
      :startHour="8"
      :endHour="14"
      :slotMinutes="30"
      :disabled="state.disabled"
      @change="(value) => (state.last = value.kind)"
      @select="(value) => (state.selected = value)"
      @error="(value) => (state.error = value)"
    />
    <MText>{{ `Start: ${state.events[0]?.start ?? 0}` }}</MText>
    <MText>{{ `End: ${state.events[0]?.end ?? 0}` }}</MText>
    <MText>{{ state.events[0]?.note ?? 'missing' }}</MText>
    <MText>{{ `Last: ${state.last}` }}</MText>
    <MText>{{ `Selected: ${state.selected}` }}</MText>
    <MText>{{ `Error: ${state.error}` }}</MText>
    <MButton
      :text="state.disabled ? 'Unlock' : 'Lock'"
      @click="() => (state.disabled = !state.disabled)"
    />
  </MColumn>
</template>
