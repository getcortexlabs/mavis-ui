<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DataColumn, DataSort } from '#mavis'
import type { Book, Heading } from './types'

const books = ref<Book[]>([
  { id: 'b1', title: 'Dune', author: 'Herbert', pages: 612, lent: false },
  { id: 'b2', title: 'Emma', author: 'Austen', pages: 474, note: 'Gift', lent: true },
  { id: 'b3', title: 'Ulysses', author: 'Joyce', pages: 730, lent: false },
])
const none = ref<Book[]>([])
const columns = ref<DataColumn[]>([
  { key: 'title', label: 'Title', sortable: true },
  { key: 'author', label: 'Author' },
  { key: 'pages', label: 'Pages', sortable: true, width: 96, align: 'end' },
  { key: 'note', label: 'Note' },
])
const short = ref<Heading[]>([
  { key: 'title', label: 'Title' },
  { key: 'mark', label: 'Mark', width: 96 },
])
const sort = ref<DataSort | null>(null)
const selected = ref(['elsewhere'])
const busy = ref(false)
const ordered = computed<Book[]>(() => {
  const key = sort.value?.key ?? ''
  const sign = sort.value?.direction === 'descending' ? -1 : 1
  return key === 'pages'
    ? books.value.toSorted((a, b) => (a.pages - b.pages) * sign)
    : key === 'title'
      ? books.value.toSorted((a, b) => (a.title < b.title ? -sign : sign))
      : books.value
})
</script>

<template>
  <MColumn gap="lg">
    <MDataTable
      id="books"
      v-model:sort="sort"
      v-model:selected="selected"
      label="Library"
      :items="ordered"
      :columns="columns"
      selectable
      :loading="busy"
      :row-disabled="(item) => item.lent"
      :row-label="(item) => item.title"
    >
      <template #actions>
        <MButton :text="busy ? 'Stop' : 'Reload'" variant="secondary" @click="busy = !busy" />
      </template>
      <template #footer>
        <MText variant="caption">{{ selected.length }} selected</MText>
      </template>
    </MDataTable>
    <m-data-table
      label="Marks"
      :items="books"
      :columns="short"
      :selected="['b1']"
      selectable
      select-label="Mark"
      select-all-label="Mark all"
    >
      <template #cell="{ item, column, index }">
        <MText v-if="column.key === 'title'" :id="`title-${item.id}`" weight="600">
          {{ index + 1 }}. {{ item.title }}
        </MText>
        <MColumn v-else :id="`mark-${item.id}`" :height="16" />
      </template>
    </m-data-table>
    <MDataTable label="Returned" :items="none" :columns="short" empty-label="Nothing yet" />
  </MColumn>
</template>
