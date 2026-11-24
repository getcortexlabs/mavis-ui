<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  city: 'lis' as string | number | undefined,
  query: 'Lis' as string,
  locked: false as boolean,
  events: 0 as number,
  cities: [
    { value: 'lis', label: 'Lisbon', helperText: undefined, disabled: undefined },
    { value: 'lim', label: 'Lima', helperText: undefined, disabled: undefined },
    { value: 'lyo', label: 'Lyon', disabled: true, helperText: undefined },
    { value: 'osl', label: 'Oslo', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  get summary(): string {
    return `City ${state.city ?? 'none'}, query "${state.query}", ${state.events} choices`
  },
})
</script>

<template>
  <MColumn gap="md">
    <MCombobox
      id="city"
      label="City"
      :modelValue="state.city ?? null"
      @update:modelValue="
        (choice) => ((value) => (state.city = value))(choice === null ? undefined : choice)
      "
      :query="state.query"
      @update:query="(value) => (state.query = value)"
      :selectedOption="state.cities.find((item) => item.value === state.city) ?? null"
      :search="
        async (text) =>
          state.cities.filter((item) => item.label.toLowerCase().includes(text.toLowerCase()))
      "
      :debounce="0"
      placeholder="Where to?"
      helperText="Type a city"
      clearLabel="Clear city"
      :disabled="state.locked"
      @select="() => (state.events += 1)"
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
