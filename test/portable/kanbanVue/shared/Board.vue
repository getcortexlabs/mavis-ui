<script setup lang="ts">
import { ref } from 'vue'
import type { KanbanColumn, KanbanCard } from '#mavis'
const columns = ref<KanbanColumn[]>([
  { id: 'todo', title: 'To do' },
  { id: 'done', title: 'Done', limit: 1 },
])
const cards = ref<KanbanCard[]>([
  { id: 'plan', column: 'todo', title: 'Plan', description: 'Map the journey' },
  { id: 'build', column: 'todo', title: 'Build', description: 'Make it real' },
  { id: 'ship', column: 'done', title: 'Ship', disabled: true },
])
const last = ref('none')
const query = ref('')
const locked = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MKanban
      id="board"
      label="Studio board"
      :columns="columns"
      v-model="cards"
      :query="query"
      :disabled="locked"
      @move="
        (move) => (last = `${move.id}: ${move.from} to ${move.to}, before ${move.before ?? 'end'}`)
      "
    />
    <MRow gap="sm">
      <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
      <MButton text="Filter Build" @click="query = 'Build'" />
      <MButton text="Show all" @click="query = ''" />
    </MRow>
    <MText>Last: {{ last }}</MText>
  </MColumn>
</template>
