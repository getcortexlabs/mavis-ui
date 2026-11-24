<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  date: '2024-02-28' as string | undefined,
  draft: '28/02/2024' as string,
  reason: 'none' as string,
  locked: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MDatePicker
      label="Birthday"
      :modelValue="state.date ?? null"
      @update:modelValue="(value) => ((value) => (state.date = value))(value ?? undefined)"
      :draft="state.draft"
      @update:draft="(value) => (state.draft = value)"
      @validityChange="
        (value) =>
          ((value) => (state.reason = value.reason ?? 'valid'))({
            ...value,
            reason: value.reason ?? undefined,
          })
      "
      locale="pt-BR"
      dateFormat="locale"
      initialMonth="2024-02"
      min="2024-02-01"
      max="2024-03-31"
      :unavailableDates="['2024-02-29']"
      :disabled="state.locked"
    />
    <MText>{{ `Date: ${state.date ?? 'none'}` }}</MText>
    <MText>{{ `Draft: ${state.draft}` }}</MText>
    <MText>{{ `Reason: ${state.reason}` }}</MText>
    <MButton
      :text="state.locked ? 'Unlock' : 'Lock'"
      @click="() => (state.locked = !state.locked)"
    />
  </MColumn>
</template>
