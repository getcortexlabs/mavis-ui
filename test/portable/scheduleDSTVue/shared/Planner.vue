<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate } from '#mavis'
type Session = { id: string; title: string; start: number; end: number; note: string }
const events = ref<Session[]>([
  {
    id: 'design',
    title: 'Design',
    start: 1772951400000,
    end: 1772958600000,
    note: 'Keep metadata',
  },
])
const date = ref<CivilDate>('2026-03-08')
const last = ref('none'),
  selected = ref('none'),
  error = ref(''),
  disabled = ref(false)
</script>
<template>
  <MColumn gap="md"
    ><MScheduler
      label="Studio schedule"
      v-model="events"
      v-model:date="date"
      timeZone="America/New_York"
      :days="1"
      :startHour="0"
      :endHour="5"
      :slotMinutes="30"
      :disabled="disabled"
      @change="(value) => (last = value.kind)"
      @select="(value) => (selected = value)"
      @error="(value) => (error = value)" /><MText>{{ `Start: ${events[0]?.start ?? 0}` }}</MText
    ><MText>{{ `End: ${events[0]?.end ?? 0}` }}</MText
    ><MText>{{ events[0]?.note ?? 'missing' }}</MText
    ><MText>{{ `Last: ${last}` }}</MText
    ><MText>{{ `Selected: ${selected}` }}</MText
    ><MText>{{ `Error: ${error}` }}</MText
    ><MButton :text="disabled ? 'Unlock' : 'Lock'" @click="disabled = !disabled"
  /></MColumn>
</template>
