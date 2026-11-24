<script setup lang="ts">
import { reactive } from 'vue'
import * as mavisCities from './shared/cities'

const cities = mavisCities.useCities()
const state = reactive({
  selected: undefined as string | number | undefined,
  query: '' as string,
  result: 'No selection' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MCombobox
      label="City"
      :modelValue="state.selected ?? null"
      @update:modelValue="
        (choice) => ((value) => (state.selected = value))(choice === null ? undefined : choice)
      "
      :query="state.query"
      @update:query="(value) => (state.query = value)"
      :search="
        async (query, context) => {
          context.onCancel(() => {
            cities.cancel()
          })
          const result = await cities.search(query, context.limit)
          return result
        }
      "
      :debounce="0"
      :maxResults="2"
      @select="
        (option) =>
          ((option) => (state.result = option?.label ?? 'No selection'))(
            option === null ? undefined : option,
          )
      "
    />
    <MText>{{ state.result }}</MText>
  </MColumn>
</template>
