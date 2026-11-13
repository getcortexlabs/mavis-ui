<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MSelect, MText } from '#mavis'
import type { ChoiceValue } from '#mavis'

type AppOption = { value: ChoiceValue; label: string; disabled?: boolean }
const chosen = ref<ChoiceValue | null>(null)
const number = ref<number | null>(null)
const changes = ref(0)
const options: AppOption[] = [
  { value: 1, label: 'Number one' },
  { value: '1', label: 'Text one' },
  { value: 0, label: 'Zero' },
  { value: 2, label: 'Blocked', disabled: true },
]
const summary = computed(() =>
  chosen.value === null
    ? 'No selection'
    : chosen.value === 1
      ? 'Numeric one'
      : chosen.value === '1'
        ? 'Textual one'
        : `Other ${chosen.value ?? 'none'}`,
)
function change(value: ChoiceValue) {
  chosen.value = value
  changes.value += 1
}
function reset() {
  chosen.value = null
  number.value = null
}
</script>
<template>
  <MColumn gap="md">
    <MSelect
      label="Mixed"
      :model-value="chosen"
      :options="options"
      :width="320"
      placeholder="Choose mixed"
      @update:model-value="change"
    />
    <MSelect
      label="Numeric"
      v-model="number"
      :options="[
        { value: 1, label: 'One' },
        { value: 0, label: 'Zero' },
      ]"
      placeholder="Choose number"
    />
    <MText>{{ summary }}</MText>
    <MText>{{ `Number ${number ?? -1}; changes ${changes}` }}</MText>
    <MButton text="Reset" @click="reset" />
  </MColumn>
</template>
