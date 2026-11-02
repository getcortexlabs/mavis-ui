<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { ChoiceOption, ChoiceValue, ComboboxSearch } from '@getcortexlabs/mavis-core'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const cities: ChoiceOption[] = [
  { value: 2611606, label: 'Recife', helperText: 'Pernambuco' },
  { value: 3550308, label: 'São Paulo', helperText: 'São Paulo' },
  { value: 3304557, label: 'Rio de Janeiro', helperText: 'Rio de Janeiro' },
  { value: 2927408, label: 'Salvador', helperText: 'Bahia' },
  { value: 2304400, label: 'Fortaleza', helperText: 'Ceará' },
  { value: 3106200, label: 'Belo Horizonte', helperText: 'Minas Gerais' },
]
const value = ref<ChoiceValue | null>(2611606)
const query = ref('Recife')
const selection = ref<ChoiceOption | null>(cities[0]!)
const fail = ref(false)
const delayed = ref(false)
const requests = ref(0)
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
const search: ComboboxSearch = (text, { onCancel, limit }) =>
  new Promise((resolve, reject) => {
    requests.value++
    const fails = fail.value
    fail.value = false
    // Short queries deliberately arrive after longer queries when the switch is enabled.
    const ignoreCancellation = delayed.value
    const timer = setTimeout(
      () => {
        if (fails) reject(new Error('Demo search failed'))
        else
          resolve(
            cities
              .filter((city) => normalize(city.label).includes(normalize(text)))
              .slice(0, limit),
          )
      },
      ignoreCancellation && text.length < 3 ? 1200 : 250,
    )
    onCancel(() => {
      if (!ignoreCancellation) {
        clearTimeout(timer)
        reject(new Error('Cancelled'))
      }
    })
  })
</script>

<template>
  <m-column gap="lg">
    <m-text variant="heading">{{ t(pt ? 'Encontre seu lugar.' : 'Find your place.') }}</m-text>
    <m-text tone="muted">{{
      t(
        pt
          ? 'Busque uma cidade pelo nome e confirme um resultado.'
          : 'Search for a city by name and confirm a result.',
      )
    }}</m-text>
    <m-combobox
      v-model="value"
      v-model:query="query"
      :selectedOption="selection"
      :initialResults="{ query: 'Recife', options: [cities[0]!] }"
      :search="search"
      :label="t(pt ? 'Município' : 'Municipality')"
      :placeholder="t(pt ? 'Buscar municípios' : 'Search municipalities')"
      :helperText="
        t(
          pt
            ? 'A busca não muda sua seleção até você confirmar.'
            : 'Searching keeps your selection until you confirm.',
        )
      "
      :clearLabel="t(pt ? 'Limpar município' : 'Clear municipality')"
      :closeLabel="t(pt ? 'Fechar resultados' : 'Close results')"
      :loadingText="t(pt ? 'Buscando…' : 'Searching…')"
      :emptyText="t(pt ? 'Nenhum município encontrado' : 'No municipalities found')"
      :searchErrorText="pt ? 'Não foi possível buscar.' : 'Search could not finish.'"
      :retryLabel="pt ? 'Tentar novamente' : 'Try again'"
      :idleText="pt ? 'Digite para buscar.' : 'Type to search.'"
      :limitedText="
        pt ? 'Refine a busca para ver mais resultados.' : 'Refine your search to see more results.'
      "
      @select="selection = $event"
    />
    <m-text variant="caption" tone="primary">{{
      t(
        pt
          ? `Seleção: ${selection?.label ?? 'nenhuma'}`
          : `Selection: ${selection?.label ?? 'none'}`,
      )
    }}</m-text>
    <m-switch
      v-model="fail"
      :label="t(pt ? 'Simular falha na próxima busca' : 'Fail the next search')"
    />
    <m-switch
      v-model="delayed"
      :label="t(pt ? 'Simular respostas fora de ordem' : 'Simulate out-of-order responses')"
    />
    <m-text variant="caption" tone="muted">{{
      t(pt ? `${requests} buscas nesta sessão` : `${requests} searches in this session`)
    }}</m-text>
  </m-column>
</template>
