<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  chosen: undefined as string | number | undefined,
  options: [
    { value: 1, label: 'Number one', helperText: undefined, disabled: undefined },
    { value: '1', label: 'Text one', helperText: undefined, disabled: undefined },
    { value: 0, label: 'Zero', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  segments: [
    { value: 1, label: 'Segment number', helperText: undefined, disabled: undefined },
    { value: '1', label: 'Segment text', helperText: undefined, disabled: undefined },
    { value: 0, label: 'Segment zero', helperText: undefined, disabled: undefined },
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
    <MRadioGroup
      label="Radio"
      :modelValue="state.chosen ?? null"
      :options="state.options"
      @update:modelValue="(choice) => ((value) => (state.chosen = value))(choice)"
    />
    <MSegmentedControl
      label="Segments"
      :modelValue="state.chosen ?? null"
      :options="state.segments"
      @update:modelValue="(choice) => ((value) => (state.chosen = value))(choice)"
    />
    <MText>{{ state.summary }}</MText>
  </MColumn>
</template>
