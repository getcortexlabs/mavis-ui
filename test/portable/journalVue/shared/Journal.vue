<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MButton, MColumn, MRow, MText } from '#mavis'
import Counted from './Counted.vue'
import { useNotes } from './notes'

const store = useNotes()
const { status } = useNotes()
const log = ref('Nothing changed')
const shown = ref(0)
const hidden = ref(0)
const details = ref(false)
const total = computed(() => store.notes.value.length)

onMounted(async () => {
  await store.restore()
  log.value = `Started ${status.value}`
})
watch(
  () => store.open.value,
  (open, before) => {
    log.value = `Open went from ${before} to ${open}`
  },
)
watch(total, (count) => {
  if (count === 3) details.value = false
})
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">{{ store.open.value }} open of {{ total }}</MText>
    <MText>Status: {{ status }}</MText>
    <MText>{{ log }}</MText>
    <MText>Details shown {{ shown }}, hidden {{ hidden }}</MText>
    <MRow gap="sm" wrap>
      <MButton @click="store.draft.value = 'Call home'">Suggest</MButton>
      <MButton @click="store.add()">Add</MButton>
      <MButton @click="details = !details">{{ details ? 'Hide details' : 'Show details' }}</MButton>
    </MRow>
    <Counted v-if="details" label="Kept by the host" @shown="shown += 1" @hidden="hidden += 1" />
    <MButton v-for="note in store.notes.value" :key="note.id" @click="store.toggle(note.id)">
      {{ note.done ? 'Done' : 'Open' }} {{ note.id }}: {{ note.title }}
    </MButton>
  </MColumn>
</template>
