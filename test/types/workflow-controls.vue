<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { MCombobox } from '@getcortexlabs/mavis-web'
import { MCombobox as NativeCombobox } from '@getcortexlabs/mavis/vue'
import type {
  ChoiceOption,
  ChoiceValue,
  ComboboxSearch,
  InputHandle,
} from '@getcortexlabs/mavis-core'
const value = ref<ChoiceValue | null>(null)
const query = ref('')
const selected = ref<ChoiceOption | null>(null)
const search: ComboboxSearch = async (query, { limit, onCancel, requestId }) => {
  query satisfies string
  limit satisfies number
  requestId satisfies number
  onCancel(() => {})
  return [
    { value: 1, label: 'One' },
    { value: '1', label: 'String one' },
  ]
}
const web = ref<InstanceType<typeof MCombobox>>()
const native = useTemplateRef('native')
const global = useTemplateRef('global')
const portable = ref<InputHandle>()
web.value?.focus()
web.value?.blur()
native.value?.focus()
native.value?.blur()
global.value?.focus()
global.value?.blur()
portable.value?.focus()
// @ts-expect-error the portable handle does not expose a DOM editor
web.value?.editor
</script>
<template>
  <MCombobox
    ref="web"
    v-model="value"
    v-model:query="query"
    label="Web"
    :search="search"
    :selectedOption="selected"
    @select="selected = $event"
  />
  <NativeCombobox
    ref="native"
    v-model="value"
    v-model:query="query"
    label="Native"
    :search="search"
    :initialResults="{ query: '', options: [] }"
  />
  <m-combobox ref="global" v-model="value" v-model:query="query" label="Global" :search="search" />
  <MCombobox ref="portable" :modelValue="null" query="" label="Portable" :search="search" />
  <!-- @vue-expect-error query is controlled and required -->
  <MCombobox label="Missing query" :search="search" />
  <!-- @vue-expect-error search is host-owned and required -->
  <NativeCombobox label="Missing service" query="" />
  <!-- @vue-expect-error selection cannot contain multiple values -->
  <m-combobox :modelValue="[]" query="" label="Single" :search="search" />
  <!-- @vue-expect-error typed option identifiers exclude booleans -->
  <MCombobox
    query=""
    label="Invalid snapshot"
    :search="search"
    :selectedOption="{ value: true, label: 'Boolean' }"
  />
  <!-- @vue-expect-error query events contain text, not DOM events -->
  <m-combobox
    query=""
    label="Event"
    :search="search"
    @update:query="(event: Event) => event.preventDefault()"
  />
</template>
