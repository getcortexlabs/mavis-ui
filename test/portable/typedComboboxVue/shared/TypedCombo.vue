<script setup lang="ts">
import { ref, computed } from 'vue'
import { MColumn, MText, MCombobox } from '#mavis'
import type { ChoiceValue, ChoiceOption } from '#mavis'
const chosen = ref<ChoiceValue | null>(null)
const query = ref('')
const options: ChoiceOption[] = [
  { value: 1, label: 'Number one' },
  { value: '1', label: 'Text one' },
  { value: 0, label: 'Zero' },
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
    ><MCombobox
      label="Choice"
      v-model="chosen"
      v-model:query="query"
      :search="
        async (query) =>
          options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
      "
      :min-query-length="0"
      :debounce="0"
    /><MText>{{ summary }}</MText></MColumn
  >
</template>
