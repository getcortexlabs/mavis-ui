<script setup lang="ts">
import { ref, computed } from 'vue'
import { MColumn, MText, MMultiSelect } from '#mavis'
import type { ChoiceValue, ChoiceOption } from '#mavis'
const chosen = ref<ChoiceValue[]>([])
const options: ChoiceOption[] = [
  { value: 1, label: 'Number one' },
  { value: '1', label: 'Text one' },
  { value: 0, label: 'Zero' },
]
const summary = computed(() =>
  chosen.value.length === 0
    ? 'None'
    : chosen.value.map((value) => (value === 1 ? 'N' : value === '1' ? 'S' : 'Z')).join(', '),
)
</script>
<template>
  <MColumn gap="md"
    ><MMultiSelect
      label="Values"
      v-model="chosen"
      :options="options"
      placeholder="Choose values"
    /><MText>{{ summary }}</MText></MColumn
  >
</template>
