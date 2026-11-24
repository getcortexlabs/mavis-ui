<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  view: 'week' as string | number | undefined,
  size: undefined as string | number | undefined,
  views: [
    { value: 'day', label: 'Day', helperText: undefined, disabled: undefined },
    { value: 'week', label: 'Week', helperText: undefined, disabled: undefined },
    { value: 'month', label: 'Month', helperText: undefined, disabled: undefined },
    { value: 'year', label: 'Year', disabled: true, helperText: undefined },
  ] as SelectOption[],
  sizes: [
    { value: 's', label: 'Small', helperText: undefined, disabled: undefined },
    { value: 'l', label: 'Large', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  modes: [
    { value: 'auto', label: 'Automatic', helperText: undefined, disabled: undefined },
    { value: 'manual', label: 'Manual', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  pick(next: string | number): void {
    if (next !== 'day') {
      state.view = next
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MSegmentedControl
      id="views"
      label="Calendar view"
      :options="state.views"
      :modelValue="state.view ?? null"
      @update:modelValue="(choice) => ((next) => state.pick(next))(choice)"
    />
    <MText id="view-text">{{ `View ${state.view ?? 'none'}` }}</MText>
    <MRow gap="md">
      <MSegmentedControl
        id="sizes"
        label="Size"
        :options="state.sizes"
        :modelValue="state.size ?? null"
        @update:modelValue="(choice) => ((value) => (state.size = value))(choice)"
        :width="240"
      />
      <MText id="size-text" :grow="1">{{ `Size ${state.size ?? 'none'}` }}</MText>
    </MRow>
    <MButton text="Clear size" @click="() => (state.size = undefined)" />
    <MSegmentedControl
      label="Mode"
      :options="state.modes"
      :modelValue="'auto' ?? null"
      @update:modelValue="(choice) => ((value) => (state.size = value))(choice)"
      :disabled="true"
    />
  </MColumn>
</template>
