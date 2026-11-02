<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, useState } from '#imports'
import {
  MButton,
  MColumn,
  MInput,
  MFormGroup,
  MFormErrors,
  MSteps,
  MPagination,
  MCombobox,
  MFilePicker,
  useFormController,
  useFormField,
  useFileSelection,
} from '@getcortexlabs/mavis-web'
import type {
  ChoiceOption,
  ChoiceValue,
  ComboboxSearch,
  InputHandle,
  StepOption,
} from '@getcortexlabs/mavis-core'

const route = useRoute()
const router = useRouter()
const owner = useState('workflows:owner', () =>
  typeof route.query.owner === 'string' ? route.query.owner : 'Studio',
)
const ready = ref(false)
const name = ref(owner.value)
const nameInput = ref<InputHandle>()
const form = useFormController([{ field: 'name', message: `Review ${owner.value}'s name.` }])
useFormField(form, { name: 'name', label: `${owner.value} name`, target: () => nameInput.value })
const step = ref<ChoiceValue | null>('profile')
const steps: StepOption[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'documents', label: 'Documents' },
  { value: 'confirm', label: 'Confirm', disabled: true },
]
const panel = computed(() =>
  step.value === 'documents' ? 'Document panel owned by the app' : 'Profile panel owned by the app',
)
function pageFromQuery(value: unknown) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page <= 9 ? page : 1
}
const page = useState('workflows:page', () => pageFromQuery(route.query.page))
watch(
  () => route.query.page,
  (value) => {
    page.value = pageFromQuery(value)
  },
)
function navigate(value: number) {
  void router.push({ query: { ...route.query, page: String(value) } })
}
const calls = ref(0)
const cities: ChoiceOption[] = [
  { value: 2611606, label: 'Recife' },
  { value: 3304557, label: 'Rio de Janeiro' },
]
const city = ref<ChoiceValue | null>(2611606)
const selected = ref<ChoiceOption | null>(cities[0]!)
const query = ref('Recife')
const search: ComboboxSearch = async (text) => {
  if (import.meta.server) throw new Error('A combobox must not call its loader during SSR')
  calls.value++
  return cities.filter((option) => option.label.toLowerCase().includes(text.toLowerCase()))
}
const files = useFileSelection({
  initial: [
    {
      id: 'server-document',
      name: 'itinerary.pdf',
      size: 1024,
      type: 'application/pdf',
      status: 'uploaded',
    },
  ],
})
onMounted(() => {
  ready.value = true
  page.value = pageFromQuery(route.query.page)
})
</script>

<template>
  <main :data-workflow-ready="ready">
    <h1>{{ owner }} input workflows</h1>
    <MColumn padding="lg" gap="lg">
      <MFormErrors :form="form" title="Review registration" />
      <MFormGroup
        id="workflow-group"
        label="Profile details"
        description="The host owns this form and its validation."
      >
        <MInput id="workflow-name" ref="nameInput" v-model="name" :label="`${owner} name`" />
        <MButton @click="form.focusFirstError()">Focus first error</MButton>
      </MFormGroup>
      <MSteps v-model="step" :steps="steps" label="Registration steps" />
      <section aria-label="Current step panel">
        <p>{{ panel }}</p>
      </section>
      <MPagination
        :modelValue="page"
        :total="87"
        :pageSize="10"
        label="Saved result pages"
        @update:modelValue="navigate"
      />
      <output data-testid="workflow-page">{{ page }}</output>
      <MCombobox
        id="workflow-city"
        v-model="city"
        v-model:query="query"
        :selectedOption="selected"
        :initialResults="{ query: 'Recife', options: [cities[0]!] }"
        :search="search"
        :debounce="0"
        label="Destination city"
        @select="selected = $event"
      />
      <output data-testid="workflow-query">{{ query }}</output>
      <output data-testid="workflow-city-model">{{ city }}</output>
      <output data-testid="workflow-searches">{{ calls }}</output>
      <MFilePicker :selection="files" label="Trip documents" />
    </MColumn>
  </main>
</template>
