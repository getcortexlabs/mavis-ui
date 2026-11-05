<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { ChoiceValue, DataColumn, DataSort } from '@getcortexlabs/mavis-core'
const query = ref('')
const sort = ref<DataSort | null>(null)
const selected = ref<ChoiceValue[]>([])
const page = ref(1)
const items = [
  { id: 'atlas', name: 'Atlas', kind: 'Design', members: 12 },
  { id: 'bloom', name: 'Bloom', kind: 'Research', members: 8 },
  { id: 'cove', name: 'Cove', kind: 'Product', members: 24 },
  { id: 'drift', name: 'Drift', kind: 'Design', members: 6 },
  { id: 'ember', name: 'Ember', kind: 'Product', members: 16 },
  { id: 'fern', name: 'Fern', kind: 'Research', members: 4 },
]
const columns = computed<DataColumn[]>(() => [
  { key: 'name', label: t('Collection', 'Coleção'), sortable: true, width: 180 },
  { key: 'kind', label: t('Discipline', 'Disciplina'), width: 160 },
  { key: 'members', label: t('Members', 'Membros'), sortable: true, align: 'end', width: 144 },
])
const filtered = computed(() => {
  const result = items.filter((item) => item.name.toLowerCase().includes(query.value.toLowerCase()))
  if (sort.value) {
    const { key, direction } = sort.value
    result.sort(
      (a, b) =>
        (key === 'members' ? a.members - b.members : a.name.localeCompare(b.name)) *
        (direction === 'ascending' ? 1 : -1),
    )
  }
  return result
})
const visible = computed(() => filtered.value.slice((page.value - 1) * 3, page.value * 3))
</script>

<template>
  <MColumn gap="lg">
    <MText variant="overline" :text="t('YOUR WORKSPACE', 'SEU ESPAÇO')" tone="primary" />
    <MInput
      v-model="query"
      :label="t('Find a collection', 'Encontrar coleção')"
      @update:modelValue="page = 1"
    />
    <MDataTable
      :label="t('A place for every idea', 'Um lugar para cada ideia')"
      :items="visible"
      :columns="columns"
      v-model:sort="sort"
      v-model:selected="selected"
      selectable
      :rowLabel="(item) => String(item.name)"
    >
      <template #cell="{ column, value }"
        ><MBadge v-if="column.key === 'kind'" :text="String(value)" tone="primary" /><MText
          v-else
          :text="String(value)"
          :weight="column.key === 'name' ? '600' : '400'"
      /></template>
      <template #footer
        ><MPagination
          v-model="page"
          :total="filtered.length"
          :pageSize="3"
          :label="t('Collection pages', 'Páginas de coleções')"
      /></template>
    </MDataTable>
    <MText
      id="table-selection"
      :text="selected.join(', ') || t('Nothing selected', 'Nenhuma seleção')"
      tone="muted"
      variant="caption"
    />
  </MColumn>
</template>
