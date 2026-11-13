<script setup lang="ts">
import type { ChoiceValue } from '#mavis'
import { computed, ref } from 'vue'
import { MButton, MColumn, MCombobox, MText } from '#mavis'
import type { ChoiceOption } from '#mavis'

const city = ref<ChoiceValue | null>('lis')
const query = ref('Lis')
const locked = ref(false)
const events = ref(0)
const cities: ChoiceOption[] = [
  { value: 'lis', label: 'Lisbon' },
  { value: 'lim', label: 'Lima' },
  { value: 'lyo', label: 'Lyon', disabled: true },
  { value: 'osl', label: 'Oslo' },
]
const summary = computed(
  () => `City ${city.value ?? 'none'}, query "${query.value}", ${events.value} choices`,
)
</script>

<template>
  <MColumn gap="md">
    <MCombobox
      id="city"
      v-model="city"
      v-model:query="query"
      label="City"
      :selected-option="cities.find((item) => item.value === city)"
      :search="
        async (text) =>
          cities.filter((item) => item.label.toLowerCase().includes(text.toLowerCase()))
      "
      :debounce="0"
      placeholder="Where to?"
      helper-text="Type a city"
      clear-label="Clear city"
      :disabled="locked"
      @select="events += 1"
    />
    <MText id="summary">{{ summary }}</MText>
    <MButton
      id="lock"
      :text="locked ? 'Unlock' : 'Lock'"
      variant="ghost"
      @click="locked = !locked"
    />
  </MColumn>
</template>
