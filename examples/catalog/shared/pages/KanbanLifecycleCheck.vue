<script setup lang="ts">
import { ref } from 'vue'
import type { KanbanCard, KanbanColumn } from '@getcortexlabs/mavis-core'
const initialColumns = [
  { id: 'ideas', title: 'Ideas' },
  { id: 'making', title: 'Making' },
  { id: 'done', title: 'Done' },
]
const initialCards = [
  { id: 'identity', column: 'ideas', title: 'Identity' },
  { id: 'editorial', column: 'ideas', title: 'Editorial' },
  { id: 'web', column: 'making', title: 'Website' },
  { id: 'print', column: 'done', title: 'Print' },
]
const cards = ref<KanbanCard[]>([]),
  columns = ref<KanbanColumn[]>([]),
  moves = ref(0)
function reset() {
  cards.value = initialCards.map((card) => ({ ...card }))
  columns.value = initialColumns.map((column) => ({ ...column }))
  moves.value = 0
}
function removeTarget() {
  cards.value = cards.value.filter((card) => card.column !== 'done')
  columns.value = columns.value.filter((column) => column.id !== 'done')
}
reset()
</script>
<template>
  <MScreen scroll
    ><MColumn padding="lg" gap="md">
      <MRow gap="sm">
        <MButton id="lifecycle-target" text="Remove target" @click="removeTarget" />
        <MButton
          id="lifecycle-source"
          text="Remove source"
          @click="cards = cards.filter((card) => card.id !== 'identity')"
        />
        <MButton
          id="lifecycle-replace"
          text="Replace controlled data"
          @click="cards = cards.map((card) => ({ ...card }))"
        />
        <MButton id="lifecycle-reset" text="Reset" @click="reset" />
      </MRow>
      <MKanban v-model="cards" :columns="columns" label="Lifecycle board" @move="moves++" />
      <MText id="kanban-order">{{
        cards.map((card) => card.id + ':' + card.column).join(',')
      }}</MText>
      <MText id="kanban-moves">{{ moves }}</MText>
    </MColumn></MScreen
  >
</template>
