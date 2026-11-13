<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MCombobox, MText } from '#mavis'
import { useCities } from './cities'
const cities = useCities()
const selected = ref<string | null>(null)
const query = ref('')
const result = ref('No selection')
</script>
<template>
  <MColumn gap="md">
    <MCombobox
      label="City"
      v-model="selected"
      v-model:query="query"
      :search="
        async (query, context) => {
          context.onCancel(() => cities.cancel())
          const result = await cities.search(query, context.limit)
          return result
        }
      "
      :debounce="0"
      :max-results="2"
      @select="(option) => (result = option?.label ?? 'No selection')"
    />
    <MText>{{ result }}</MText>
  </MColumn>
</template>
