<script setup lang="ts">
import { reactive } from 'vue'
import type { AppOption } from './types'

const state = reactive({
  chosen: undefined as string | number | undefined,
  number: undefined as number | undefined,
  changes: 0 as number,
  options: [
    { value: 1, label: 'Number one', disabled: undefined },
    { value: '1', label: 'Text one', disabled: undefined },
    { value: 0, label: 'Zero', disabled: undefined },
    { value: 2, label: 'Blocked', disabled: true },
  ] as AppOption[],
  get summary(): string {
    return state.chosen === undefined
      ? 'No selection'
      : state.chosen === 1
        ? 'Numeric one'
        : state.chosen === '1'
          ? 'Textual one'
          : `Other ${state.chosen ?? 'none'}`
  },
  change(value: string | number): void {
    state.chosen = value
    state.changes += 1
  },
  reset(): void {
    state.chosen = undefined
    state.number = undefined
  },
})
</script>

<template>
  <MColumn gap="md">
    <MSelect
      label="Mixed"
      :modelValue="state.chosen ?? null"
      :options="state.options"
      :width="320"
      placeholder="Choose mixed"
      @update:modelValue="
        (choice: string | number) => {
          ;((value) => state.change(value))(choice)
        }
      "
    />
    <MSelect
      label="Numeric"
      :modelValue="state.number ?? null"
      :options="[
        { value: 1, label: 'One', helperText: undefined, disabled: undefined },
        { value: 0, label: 'Zero', helperText: undefined, disabled: undefined },
      ]"
      placeholder="Choose number"
      @update:modelValue="
        (choice: string | number) => {
          if (typeof choice === 'number') ((value) => (state.number = value))(choice)
        }
      "
    />
    <MText>{{ state.summary }}</MText>
    <MText>{{ `Number ${state.number ?? -1}; changes ${state.changes}` }}</MText>
    <MButton text="Reset" @click="() => state.reset()" />
  </MColumn>
</template>
