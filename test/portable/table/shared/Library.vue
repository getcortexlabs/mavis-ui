<script setup lang="ts">
import { reactive } from 'vue'
import type { Book, DataColumn, DataSort, Heading } from './types'

const state = reactive({
  books: [
    { id: 'b1', title: 'Dune', author: 'Herbert', pages: 612, lent: false, note: undefined },
    { id: 'b2', title: 'Emma', author: 'Austen', pages: 474, note: 'Gift', lent: true },
    { id: 'b3', title: 'Ulysses', author: 'Joyce', pages: 730, lent: false, note: undefined },
  ] as Book[],
  none: [] as Book[],
  columns: [
    { key: 'title', label: 'Title', sortable: true, width: undefined, align: undefined },
    { key: 'author', label: 'Author', sortable: undefined, width: undefined, align: undefined },
    { key: 'pages', label: 'Pages', sortable: true, width: 96, align: 'end' },
    { key: 'note', label: 'Note', sortable: undefined, width: undefined, align: undefined },
  ] as DataColumn[],
  short: [
    { key: 'title', label: 'Title', width: undefined },
    { key: 'mark', label: 'Mark', width: 96 },
  ] as Heading[],
  sort: undefined as DataSort | undefined,
  selected: ['elsewhere'] as string[],
  busy: false as boolean,
  get ordered(): Book[] {
    const key = state.sort?.key ?? ''
    const sign = state.sort?.direction === 'descending' ? -1 : 1
    return key === 'pages'
      ? state.books.toSorted((a, b) => (a.pages - b.pages) * sign)
      : key === 'title'
        ? state.books.toSorted((a, b) => (a.title < b.title ? -sign : sign))
        : state.books
  },
})
</script>

<template>
  <MColumn gap="lg">
    <MDataTable
      id="books"
      label="Library"
      :items="state.ordered"
      :columns="state.columns"
      :sort="state.sort"
      @update:sort="(sort) => ((value) => (state.sort = value))(sort ?? undefined)"
      :selected="state.selected"
      @update:selected="(value) => (state.selected = value)"
      :selectable="true"
      :loading="state.busy"
      :rowDisabled="(item) => item.lent"
      :rowLabel="(item) => item.title"
    >
      <template #actions>
        <MButton
          :text="state.busy ? 'Stop' : 'Reload'"
          variant="secondary"
          @click="() => (state.busy = !state.busy)"
        />
      </template>
      <template #footer>
        <MText variant="caption">{{ `${state.selected.length} selected` }}</MText>
      </template>
    </MDataTable>
    <MDataTable
      label="Marks"
      :items="state.books"
      :columns="state.short"
      :selected="['b1']"
      :selectable="true"
      selectLabel="Mark"
      selectAllLabel="Mark all"
    >
      <template #cell="{ item, column, index }">
        <template v-if="column.key === 'title'">
          <MText :id="`title-${item.id}`" weight="600">{{ `${index + 1}. ${item.title}` }}</MText>
        </template>
        <template v-else>
          <MColumn :id="`mark-${item.id}`" :height="16" />
        </template>
      </template>
    </MDataTable>
    <MDataTable
      label="Returned"
      :items="state.none"
      :columns="state.short"
      emptyLabel="Nothing yet"
    />
  </MColumn>
</template>
