<script setup lang="ts">
import { ref } from 'vue'
import type { LocalTime } from '#mavis'
const time = ref<LocalTime | null>(null)
const draft = ref('')
const status = ref('none')
const required = ref(false)
</script>
<template>
  <MColumn gap="md"
    ><MTimePicker
      label="Meeting"
      v-model="time"
      v-model:draft="draft"
      @validityChange="(value) => (status = value.status)"
      min="09:01"
      max="18:00"
      :minuteStep="15"
      :required="required" /><MText>{{ `Time: ${time ?? 'none'}` }}</MText
    ><MText>{{ `Draft: ${draft}` }}</MText
    ><MText>{{ `Status: ${status}` }}</MText
    ><MButton :text="required ? 'Optional time' : 'Require time'" @click="required = !required"
  /></MColumn>
</template>
