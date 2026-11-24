<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  chosen: undefined as string | number | undefined,
  query: '' as string,
  options: [
    { value: 1, label: 'Number one', helperText: undefined, disabled: undefined },
    { value: '1', label: 'Text one', helperText: undefined, disabled: undefined },
    { value: 0, label: 'Zero', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  get summary(): string {
    return state.chosen === undefined
      ? 'None'
      : state.chosen === 1
        ? 'Numeric one'
        : state.chosen === '1'
          ? 'Textual one'
          : 'Zero'
  },
})
</script>

<template>
  <MColumn gap="md">
    <MCombobox
      label="Choice"
      :modelValue="state.chosen ?? null"
      :query="state.query"
      @update:modelValue="
        (choice) => ((value) => (state.chosen = value))(choice === null ? undefined : choice)
      "
      @update:query="(value) => (state.query = value)"
      :search="
        async (query) =>
          state.options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
      "
      :minQueryLength="0"
      :debounce="0"
    />
    <MText>{{ state.summary }}</MText>
  </MColumn>
</template>
