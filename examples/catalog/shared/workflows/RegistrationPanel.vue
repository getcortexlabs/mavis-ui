<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { ChoiceValue, ComboboxSearch, FormError, InputHandle } from '@getcortexlabs/mavis-core'
import type { RegistrationDraft } from './registration'
import FilePickerDemo from '../demos/FilePickerDemo.vue'

const { t } = useCatalogLocale()

const props = defineProps<{
  step: string
  draft: RegistrationDraft
  errors: readonly FormError[]
  lang: 'en' | 'pt'
}>()
const emit = defineEmits<{ edit: [] }>()
const pt = computed(() => props.lang === 'pt')
const name = ref<InputHandle>()
const date = ref<InputHandle>()
const place = ref<InputHandle>()
const attachments = ref<InputHandle>()
function selectPlace(value: ChoiceValue | null) {
  props.draft.place = value === null ? null : String(value)
  emit('edit')
}
const error = (field: string) => props.errors.find((item) => item.field === field)?.message ?? ''
defineExpose({
  getField: (field: string) =>
    ({ name: name.value, date: date.value, place: place.value, attachments: attachments.value })[
      field as 'name' | 'date' | 'place' | 'attachments'
    ],
})
const places = [
  { value: 'recife', label: 'Recife · PE' },
  { value: 'salvador', label: 'Salvador · BA' },
  { value: 'santos', label: 'Santos · SP' },
  { value: 'sao-paulo', label: 'São Paulo · SP' },
]
const search: ComboboxSearch = (query, context) =>
  new Promise((resolve) => {
    const timer = setTimeout(
      () =>
        resolve(
          places.filter((place) =>
            place.label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
          ),
        ),
      250,
    )
    context.onCancel(() => {
      clearTimeout(timer)
      resolve([])
    })
  })
</script>
<template>
  <m-form-group
    v-if="step === 'details'"
    :label="t(pt ? 'O começo da história' : 'Where it begins')"
    :description="
      t(
        pt
          ? 'Dê um nome ao encontro e reserve o dia.'
          : 'Give your gathering a name and choose the day.',
      )
    "
  >
    <m-input
      ref="name"
      v-model="draft.name"
      :label="t(pt ? 'Nome do encontro' : 'Gathering name')"
      :error="t(error('name'))"
      @update:modelValue="emit('edit')"
    />
    <m-date-picker
      ref="date"
      v-model="draft.date"
      :label="t(pt ? 'Data do encontro' : 'Gathering date')"
      :locale="pt ? 'pt-BR' : 'en-US'"
      initialMonth="2026-11"
      min="2026-11-01"
      max="2027-12-31"
      :error="t(error('date'))"
      @validityChange="draft.dateValid = $event.valid"
      @update:draft="emit('edit')"
    />
  </m-form-group>
  <m-form-group
    v-else-if="step === 'place'"
    :label="t(pt ? 'Um lugar para se encontrar' : 'A place to meet')"
    :description="
      t(pt ? 'Busque uma cidade na lista de demonstração.' : 'Search the demonstration city list.')
    "
  >
    <m-combobox
      ref="place"
      :modelValue="draft.place"
      v-model:query="draft.query"
      :selectedOption="draft.selected"
      :search="search"
      :label="t(pt ? 'Cidade' : 'City')"
      :placeholder="t(pt ? 'Buscar cidade' : 'Search cities')"
      :error="t(error('place'))"
      :loadingText="t(pt ? 'Buscando…' : 'Searching…')"
      :emptyText="t(pt ? 'Nenhuma cidade encontrada' : 'No cities found')"
      :clearLabel="t(pt ? 'Limpar seleção' : 'Clear selection')"
      :closeLabel="t(pt ? 'Fechar resultados' : 'Close results')"
      :idleText="pt ? 'Digite para buscar.' : 'Type to search.'"
      @update:modelValue="selectPlace"
      @select="draft.selected = $event"
    />
  </m-form-group>
  <m-column v-else gap="lg">
    <m-form-group :label="t(pt ? 'Tudo pronto para acontecer' : 'Ready to come together')">
      <m-text variant="heading">{{ t(draft.name) }}</m-text>
      <m-text tone="muted">{{ t(draft.date) }} · {{ t(draft.selected?.label) }}</m-text>
    </m-form-group>
    <FilePickerDemo ref="attachments" :lang="lang" />
  </m-column>
</template>
