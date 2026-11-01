<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue, ChoiceOption } from '@getcortexlabs/mavis-core'
const selected = ref<ChoiceValue | null>('a')
const removed = ref(false)
const disabled = ref(false)
const reversed = ref(false)
const changes = ref(0)
const requests = ref(0)
const options = computed<ChoiceOption[]>(() => {
  const items: ChoiceOption[] = [
    { value: 'a', label: 'Alpha', disabled: disabled.value },
    { value: 1, label: 'Numeric one' },
    { value: '1', label: 'String one' },
    { value: 'off', label: 'Unavailable', disabled: true },
  ]
  const visible = removed.value ? items.slice(1) : items
  return reversed.value ? [...visible].reverse() : visible
})
function choose(value: ChoiceValue) {
  selected.value = value
  changes.value++
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-text as="h1" variant="heading">Radio contract</m-text>
      <m-radio-group
        label="Accepted choices"
        :options="options"
        :modelValue="selected"
        @update:modelValue="choose"
      />
      <m-text>{{ `Value: ${typeof selected}:${selected}; changes: ${changes}` }}</m-text>
      <m-row gap="sm" wrap>
        <m-button @click="removed = !removed">Toggle Alpha presence</m-button>
        <m-button @click="disabled = !disabled">Toggle Alpha disabled</m-button>
        <m-button @click="reversed = !reversed">Reverse options</m-button>
        <m-button @click="selected = null">Clear externally</m-button>
        <m-button @click="selected = 'missing'">Set absent value</m-button>
      </m-row>
      <m-radio-group
        label="Rejected choices"
        :options="[
          { value: 'a', label: 'Keep A' },
          { value: 'b', label: 'Request B' },
        ]"
        modelValue="a"
        @update:modelValue="requests++"
      />
      <m-text>{{ `Requests: ${requests}` }}</m-text>
    </m-column>
  </m-screen>
</template>
