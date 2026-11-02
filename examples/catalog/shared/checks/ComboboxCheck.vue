<script setup lang="ts">
import { ref } from 'vue'
import { useCatalog } from '../context'
const { navigation } = useCatalog()
import type { ChoiceOption, ChoiceValue, ComboboxSearch } from '@getcortexlabs/mavis-core'
const value = ref<ChoiceValue | null>('a')
const query = ref('Alpha')
const selected = ref<ChoiceOption | null>({ value: 'a', label: 'Alpha' })
const accept = ref(true)
const mounted = ref(true)
const disabled = ref(false)
const fail = ref(false)
const sheet = ref(false)
const requests = ref(0)
const cancelled = ref(0)
const changes = ref(0)
const options: ChoiceOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 1, label: 'Numeric one' },
  { value: '1', label: 'String one' },
  { value: 'disabled', label: 'Unavailable', disabled: true },
]
const search: ComboboxSearch = (text, { onCancel }) =>
  new Promise((resolve, reject) => {
    requests.value++
    const broken = fail.value
    fail.value = false
    const timer = setTimeout(
      () => {
        if (broken) reject(new Error('Fixture failure'))
        else if (text === 'empty') resolve([])
        else if (text === 'many')
          resolve(Array.from({ length: 120 }, (_, i) => ({ value: i, label: `Option ${i + 1}` })))
        else if (text === 'slow') resolve([{ value: 'old', label: 'Obsolete response' }])
        else resolve(options)
      },
      text === 'slow' ? 800 : 30,
    )
    onCancel(() => {
      cancelled.value++
      // Deliberately non-cancellable service to prove request identity guards on slow responses.
      if (text !== 'slow') {
        clearTimeout(timer)
        reject(new Error('Cancelled'))
      }
    })
  })
function choose(next: ChoiceValue | null) {
  changes.value++
  if (accept.value) value.value = next
}
</script>
<template>
  <m-screen scroll>
    <m-column gap="md" padding="lg">
      <m-combobox
        v-if="mounted"
        id="search-choice"
        :modelValue="value"
        :query="query"
        :selectedOption="selected"
        :search="search"
        :initialResults="{ query: 'Alpha', options }"
        label="Search choices"
        :debounce="20"
        :disabled="disabled"
        @update:query="accept && (query = $event)"
        @update:modelValue="choose"
        @select="accept && (selected = $event)"
      />
      <m-text>{{ `Value: ${typeof value}:${value ?? ''}; changes: ${changes}` }}</m-text>
      <m-text>{{ `Query: ${query}; requests: ${requests}; cancelled: ${cancelled}` }}</m-text>
      <m-text>{{ `Accept: ${accept}` }}</m-text>
      <m-button id="reject-query" @click="accept = !accept">Toggle acceptance</m-button>
      <m-button id="fail-query" @click="fail = true">Fail next</m-button>
      <m-button id="disable-query" @click="disabled = !disabled">Toggle disabled</m-button>
      <m-button id="unmount-query" @click="mounted = !mounted">Toggle mounted</m-button>
      <m-button @click="navigation.push('/checks/date')">Open date checks</m-button>
      <m-button @click="navigation.push('/showcase/gather')">Open Gather</m-button>
      <m-button id="sheet-query" @click="sheet = true">Search in Sheet</m-button>
      <m-sheet v-model:open="sheet" title="Search overlay">
        <m-form-group label="Organization group">
          <m-combobox
            id="overlay-choice"
            v-model="value"
            v-model:query="query"
            :selectedOption="selected"
            :search="search"
            :initialResults="{ query: 'Alpha', options }"
            label="Overlay search"
            :debounce="20"
            @select="selected = $event"
          />
        </m-form-group>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
