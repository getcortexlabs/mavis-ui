<script setup lang="ts">
import { reactive } from 'vue'
import * as mavisNotes from './shared/notes'
import { vMavisKeepFocus } from './runtime'

const store = mavisNotes.useNotes()
const state = reactive({
  get summary(): string {
    return `${store.open.value} open of ${store.notes.value.length}`
  },
})
</script>

<template>
  <MColumn gap="md" v-mavis-keep-focus>
    <MText variant="title">{{ state.summary }}</MText>
    <MText>{{ `Status: ${store.status.value}` }}</MText>
    <MInput
      label="New note"
      :modelValue="store.draft.value"
      @update:modelValue="(value) => (store.draft.value = value)"
    />
    <MRow gap="sm" :wrap="true">
      <MButton @click="() => store.add()" text="Add" />
      <MButton @click="() => store.restore()" text="Restore" />
      <MButton @click="() => (store.draft.value = 'Buy bread')" text="Suggest" />
    </MRow>
    <template v-for="note in store.notes.value" :key="note.id">
      <MButton
        @click="() => store.toggle(note.id)"
        :text="`${note.done ? 'Done' : 'Open'} ${note.id}: ${note.title}`"
      />
    </template>
  </MColumn>
</template>
