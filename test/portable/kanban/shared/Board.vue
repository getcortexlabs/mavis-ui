<script setup lang="ts">
import { reactive } from 'vue'
import type { KanbanCard, KanbanColumn } from './types'

const state = reactive({
  columns: [
    { id: 'todo', title: 'To do', limit: undefined },
    { id: 'done', title: 'Done', limit: 1 },
  ] as KanbanColumn[],
  cards: [
    {
      id: 'plan',
      column: 'todo',
      title: 'Plan',
      description: 'Map the journey',
      disabled: undefined,
    },
    {
      id: 'build',
      column: 'todo',
      title: 'Build',
      description: 'Make it real',
      disabled: undefined,
    },
    { id: 'ship', column: 'done', title: 'Ship', disabled: true, description: undefined },
  ] as KanbanCard[],
  last: 'none' as string,
  query: '' as string,
  locked: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MKanban
      id="board"
      label="Studio board"
      :columns="state.columns"
      :modelValue="state.cards"
      @update:modelValue="(value) => (state.cards = value)"
      :query="state.query"
      :disabled="state.locked"
      @move="
        (move) =>
          ((move) =>
            (state.last = `${move.id}: ${move.from} to ${move.to}, before ${move.before ?? 'end'}`))(
            { ...move, before: move.before ?? undefined },
          )
      "
    />
    <MRow gap="sm">
      <MButton
        :text="state.locked ? 'Unlock' : 'Lock'"
        @click="() => (state.locked = !state.locked)"
      />
      <MButton text="Filter Build" @click="() => (state.query = 'Build')" />
      <MButton text="Show all" @click="() => (state.query = '')" />
    </MRow>
    <MText>{{ `Last: ${state.last}` }}</MText>
  </MColumn>
</template>
