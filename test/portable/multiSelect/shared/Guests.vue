<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  guests: ['ana'] as (string | number)[],
  people: [
    { value: 'ana', label: 'Ana', helperText: undefined, disabled: undefined },
    { value: 'bia', label: 'Bia', helperText: undefined, disabled: undefined },
    { value: 'caio', label: 'Caio', helperText: undefined, disabled: undefined },
    { value: 'duda', label: 'Duda', disabled: true, helperText: undefined },
  ] as SelectOption[],
  locked: false as boolean,
  get summary(): string {
    return state.guests.length === 0 ? 'Nobody invited' : `Invited: ${state.guests.join(', ')}`
  },
})
</script>

<template>
  <MColumn gap="md">
    <MMultiSelect
      id="guests"
      label="Guests"
      :modelValue="state.guests"
      :options="state.people"
      @update:modelValue="(choices) => ((value) => (state.guests = value))(choices)"
      :maxSelected="2"
      placeholder="Choose guests"
      helperText="Up to two people"
      :disabled="state.locked"
    />
    <MText id="summary">{{ state.summary }}</MText>
    <MButton
      id="lock"
      :text="state.locked ? 'Unlock' : 'Lock'"
      variant="ghost"
      @click="() => (state.locked = !state.locked)"
    />
  </MColumn>
</template>
