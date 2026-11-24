<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  time: undefined as string | undefined,
  draft: '' as string,
  status: 'none' as string,
  required: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MTimePicker
      label="Meeting"
      :modelValue="state.time ?? null"
      @update:modelValue="(value) => ((value) => (state.time = value))(value ?? undefined)"
      :draft="state.draft"
      @update:draft="(value) => (state.draft = value)"
      @validityChange="
        (value) =>
          ((value) => (state.status = value.status))({ ...value, value: value.value ?? undefined })
      "
      min="09:01"
      max="18:00"
      :minuteStep="15"
      :required="state.required"
    />
    <MText>{{ `Time: ${state.time ?? 'none'}` }}</MText>
    <MText>{{ `Draft: ${state.draft}` }}</MText>
    <MText>{{ `Status: ${state.status}` }}</MText>
    <MButton
      :text="state.required ? 'Optional time' : 'Require time'"
      @click="() => (state.required = !state.required)"
    />
  </MColumn>
</template>
