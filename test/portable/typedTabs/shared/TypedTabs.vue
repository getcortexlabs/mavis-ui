<script setup lang="ts">
import { reactive } from 'vue'
import type { StepOption, TabOption } from './types'

const state = reactive({
  value: undefined as string | number | undefined,
  tabs: [
    { value: 1, label: 'Number tab', disabled: undefined },
    { value: '1', label: 'Text tab', disabled: undefined },
    { value: 0, label: 'Zero tab', disabled: undefined },
  ] as TabOption[],
  steps: [
    {
      value: 1,
      label: 'Number step',
      helperText: undefined,
      disabled: undefined,
      status: undefined,
    },
    {
      value: '1',
      label: 'Text step',
      helperText: undefined,
      disabled: undefined,
      status: undefined,
    },
    { value: 0, label: 'Zero step', helperText: undefined, disabled: undefined, status: undefined },
  ] as StepOption[],
  get summary(): string {
    return state.value === 1
      ? 'Numeric one'
      : state.value === '1'
        ? 'Textual one'
        : state.value === 0
          ? 'Zero'
          : 'None'
  },
})
</script>

<template>
  <MColumn gap="md">
    <MTabs
      label="Typed tabs"
      :tabs="state.tabs"
      :modelValue="state.value ?? null"
      @update:modelValue="(choice) => ((value) => (state.value = value))(choice)"
      :keepAlive="true"
    >
      <template #default="{ value }">
        <MText>{{
          value === 1 ? 'Number panel' : value === '1' ? 'Text panel' : 'Zero panel'
        }}</MText>
      </template>
    </MTabs>
    <MSteps
      label="Typed steps"
      :steps="state.steps"
      :modelValue="state.value ?? null"
      @update:modelValue="(choice) => ((value) => (state.value = value))(choice)"
    />
    <MText>{{ state.summary }}</MText>
    <MButton text="Clear" @click="() => (state.value = undefined)" />
  </MColumn>
</template>
