<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  chosen: [] as (string | number)[],
  options: [
    { value: 1, label: 'Number one', helperText: undefined, disabled: undefined },
    { value: '1', label: 'Text one', helperText: undefined, disabled: undefined },
    { value: 0, label: 'Zero', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  get summary(): string {
    return state.chosen.length === 0
      ? 'None'
      : state.chosen.map((value) => (value === 1 ? 'N' : value === '1' ? 'S' : 'Z')).join(', ')
  },
})
</script>

<template>
  <MColumn gap="md">
    <MMultiSelect
      label="Values"
      :modelValue="state.chosen"
      :options="state.options"
      @update:modelValue="(choices) => ((value) => (state.chosen = value))(choices)"
      placeholder="Choose values"
    />
    <MText>{{ state.summary }}</MText>
  </MColumn>
</template>
