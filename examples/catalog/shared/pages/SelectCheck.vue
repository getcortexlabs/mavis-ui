<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
const value = ref<ChoiceValue | null>('a')
const changes = ref(0)
const requests = ref(0)
const show = ref(true)
const disabled = ref(false)
const many = ref(false)
const options = ref<ChoiceOption[]>([
  { value: 'a', label: 'Alpha' },
  { value: 1, label: 'Numeric one' },
  { value: '1', label: 'String one', helperText: 'A string, not a number.' },
  { value: 'off', label: 'Unavailable', disabled: true },
])
const choices = computed(() =>
  many.value
    ? Array.from({ length: 50 }, (_, index) => ({
        value: index,
        label: `Option ${String(index + 1).padStart(2, '0')}`,
        helperText: 'Local option with a description.',
      }))
    : options.value,
)
function choose(next: ChoiceValue) {
  value.value = next
  changes.value++
}
// Browser checks dispatch these same controls while the modal makes the page inert.
function remove() {
  options.value = options.value.filter((option) => option.value !== 'a')
}
function disable() {
  options.value = options.value.map((option) => ({
    ...option,
    disabled: option.value === 'a' || option.disabled,
  }))
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-input label="Editor" placeholder="Type before opening" />
      <m-select
        v-if="show"
        id="accepted"
        :modelValue="value"
        :options="choices"
        label="Accepted choices"
        :disabled="disabled"
        @update:modelValue="choose"
      />
      <m-text>Value: {{ typeof value }}:{{ value }}; changes: {{ changes }}</m-text>
      <m-select
        id="rejected"
        modelValue="a"
        :options="options"
        label="Rejected choices"
        @update:modelValue="requests++"
      />
      <m-text>Requests: {{ requests }}</m-text>
      <m-select :options="[]" label="Empty choices" emptyText="Nothing here yet" />
      <m-select
        :options="[{ value: 'off', label: 'Disabled', disabled: true }]"
        label="All disabled"
      />
      <m-button id="remove" @click="remove">Remove Alpha</m-button>
      <m-button id="disable-option" @click="disable">Disable Alpha</m-button>
      <m-button id="reverse" @click="options.reverse()">Reverse options</m-button>
      <m-button id="clear" @click="value = null">Clear externally</m-button>
      <m-button id="missing" @click="value = 'missing'">Set absent value</m-button>
      <m-button id="disable" @click="disabled = !disabled">Toggle disabled</m-button>
      <m-button id="unmount" @click="show = !show">Toggle component</m-button>
      <m-button id="many" @click="many = !many">Toggle fifty options</m-button>
    </m-column>
  </m-screen>
</template>
