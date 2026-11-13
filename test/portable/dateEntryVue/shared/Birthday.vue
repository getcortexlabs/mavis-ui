<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate } from '#mavis'
const date = ref<CivilDate | null>('2024-02-28')
const draft = ref('28/02/2024')
const reason = ref('none')
const locked = ref(false)
</script>
<template>
  <MColumn gap="md"
    ><MDatePicker
      label="Birthday"
      v-model="date"
      v-model:draft="draft"
      @validityChange="(value) => (reason = value.reason ?? 'valid')"
      locale="pt-BR"
      dateFormat="locale"
      initialMonth="2024-02"
      min="2024-02-01"
      max="2024-03-31"
      :unavailableDates="['2024-02-29']"
      :disabled="locked" /><MText>{{ `Date: ${date ?? 'none'}` }}</MText
    ><MText>{{ `Draft: ${draft}` }}</MText
    ><MText>{{ `Reason: ${reason}` }}</MText
    ><MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked"
  /></MColumn>
</template>
