<script setup lang="ts">
import { ref, computed } from 'vue'
import { MColumn, MText, MRadioGroup, MSegmentedControl } from '#mavis'
import type { ChoiceValue, ChoiceOption } from '#mavis'
const chosen = ref<ChoiceValue | null>(null)
const options: ChoiceOption[] = [
  { value: 1, label: 'Number one' },
  { value: '1', label: 'Text one' },
  { value: 0, label: 'Zero' },
]
const segments: ChoiceOption[] = [
  { value: 1, label: 'Segment number' },
  { value: '1', label: 'Segment text' },
  { value: 0, label: 'Segment zero' },
]
const summary = computed(() =>
  chosen.value === null
    ? 'None'
    : chosen.value === 1
      ? 'Numeric one'
      : chosen.value === '1'
        ? 'Textual one'
        : 'Zero',
)
</script>
<template>
  <MColumn gap="md"
    ><MRadioGroup label="Radio" v-model="chosen" :options="options" /><MSegmentedControl
      label="Segments"
      v-model="chosen"
      :options="segments"
    /><MText>{{ summary }}</MText></MColumn
  >
</template>
