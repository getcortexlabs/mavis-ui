<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate } from '#mavis'
const selected = ref<CivilDate>('2024-02-28')
const locked = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MCalendar
      label="Choose a day"
      v-model="selected"
      min="2024-02-01"
      max="2024-03-31"
      :unavailableDates="['2024-02-29']"
      initialMonth="2024-02"
      :disabled="locked"
    />
    <MText>{{ `Selected: ${selected}` }}</MText>
    <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
  </MColumn>
</template>
