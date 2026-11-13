<script setup lang="ts">
import type { ChoiceValue } from '#mavis'
import { ref } from 'vue'
import type { SegmentedOption } from '#mavis'

const view = ref<ChoiceValue | null>('week')
const size = ref<ChoiceValue | null>(null)
const views: SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year', disabled: true },
]
const sizes: SegmentedOption[] = [
  { value: 's', label: 'Small' },
  { value: 'l', label: 'Large' },
]
const modes: SegmentedOption[] = [
  { value: 'auto', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
]

// The source keeps the day view out.
function pick(next: ChoiceValue) {
  if (next !== 'day') view.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MSegmentedControl
      id="views"
      label="Calendar view"
      :options="views"
      :model-value="view"
      @update:model-value="pick"
    />
    <MText id="view-text">View {{ view ?? 'none' }}</MText>
    <MRow gap="md">
      <m-segmented-control id="sizes" v-model="size" label="Size" :options="sizes" :width="240" />
      <MText id="size-text" :grow="1">Size {{ size ?? 'none' }}</MText>
    </MRow>
    <MButton @click="size = null">Clear size</MButton>
    <MSegmentedControl
      label="Mode"
      :options="modes"
      model-value="auto"
      disabled
      @update:model-value="(value) => (size = value)"
    />
  </MColumn>
</template>
