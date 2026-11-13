<script setup lang="ts">
import { computed } from 'vue'
import { MButton, MColumn, MInput, MRow, MText } from '#mavis'
import { useNotes } from './notes'

const store = useNotes()
const summary = computed(() => `${store.open.value} open of ${store.notes.value.length}`)
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">{{ summary }}</MText>
    <MText>Status: {{ store.status.value }}</MText>
    <MInput v-model="store.draft.value" label="New note" />
    <MRow gap="sm" wrap>
      <MButton @click="store.add()">Add</MButton>
      <MButton @click="store.restore()">Restore</MButton>
      <MButton @click="store.draft.value = 'Buy bread'">Suggest</MButton>
    </MRow>
    <MButton v-for="note in store.notes.value" :key="note.id" @click="store.toggle(note.id)">
      {{ note.done ? 'Done' : 'Open' }} {{ note.id }}: {{ note.title }}
    </MButton>
  </MColumn>
</template>
