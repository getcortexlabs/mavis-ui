<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, onScopeDispose, ref, watch } from 'vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const all = [
  'Recife',
  'Salvador',
  'Santos',
  'São Paulo',
  'Natal',
  'Fortaleza',
  'Belém',
  'Manaus',
  'Curitiba',
  'Maceió',
  'João Pessoa',
  'Florianópolis',
  'Rio de Janeiro',
]
const query = ref('')
const page = ref(1)
const total = ref(all.length)
const rows = ref(all.slice(0, 3))
const loading = ref(false)
let revision = 0
let timer: ReturnType<typeof setTimeout> | undefined
function load(next: number) {
  clearTimeout(timer)
  const request = ++revision
  const filter = query.value.toLocaleLowerCase('pt-BR')
  loading.value = true
  // Replace this local dataset with the host's request, preserving the generation check.
  timer = setTimeout(() => {
    if (request !== revision) return
    const result = all.filter((item) => item.toLocaleLowerCase('pt-BR').includes(filter))
    const current = Math.max(1, Math.min(next, Math.ceil(result.length / 3)))
    total.value = result.length
    page.value = current
    rows.value = result.slice((current - 1) * 3, current * 3)
    loading.value = false
  }, 250)
}
watch(query, () => load(1))
onScopeDispose(() => {
  revision++
  clearTimeout(timer)
})
</script>
<template>
  <m-column gap="lg">
    <m-input v-model="query" :label="t(pt ? 'Filtrar destinos' : 'Filter destinations')" />
    <m-column gap="sm" id="pagination-results">
      <m-card v-for="(city, index) in rows" :key="city" padding="md" gap="xs">
        <m-text variant="overline" tone="primary"
          >{{ t(String((page - 1) * 3 + index + 1).padStart(2, '0')) }}{{ t(' / BRASIL') }}</m-text
        >
        <m-text variant="heading">{{ t(city) }}</m-text>
      </m-card>
    </m-column>
    <m-pagination
      :modelValue="page"
      :total="total"
      :pageSize="3"
      :loading="loading"
      :statusText="
        loading
          ? pt
            ? 'Buscando destinos…'
            : 'Loading destinations…'
          : `${pt ? 'Página' : 'Page'} ${page} · ${rows.length} ${pt ? 'nesta página' : 'on this page'} · ${total} ${pt ? 'destinos' : 'destinations'}`
      "
      :label="t(pt ? 'Páginas de destinos' : 'Destination pages')"
      :previousLabel="t(pt ? 'Anterior' : 'Previous')"
      :nextLabel="t(pt ? 'Próxima' : 'Next')"
      :pageLabel="pt ? 'Página' : 'Page'"
      :currentLabel="pt ? 'Atual' : 'Current'"
      :emptyLabel="t(pt ? 'Nenhum destino encontrado' : 'No destinations found')"
      @update:modelValue="load"
    />
  </m-column>
</template>
