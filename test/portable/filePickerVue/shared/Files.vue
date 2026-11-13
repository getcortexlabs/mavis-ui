<script setup lang="ts">
import { ref } from 'vue'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
import { MButton, MColumn, MFilePicker, MText } from '#mavis'
const files = useFileSelection({
  multiple: true,
  maxCount: 3,
  maxSize: 4096,
  accept: ['.pdf', 'image/*'],
  initial: [
    { id: 'brief', name: 'Brief.pdf', size: 120, type: 'application/pdf', status: 'uploaded' },
    {
      id: 'photo',
      name: 'Photo.png',
      size: 240,
      type: 'image/png',
      status: 'failed',
      error: 'Try another connection',
    },
  ],
})
const locked = ref(false)
const inspected = ref('Not inspected')
</script>

<template>
  <MColumn gap="md">
    <MFilePicker
      label="Documents"
      :selection="files"
      :disabled="locked"
      choose-label="Browse documents"
      remove-label="Forget"
      empty-label="Nothing selected"
      :status-labels="{ uploaded: 'Stored', failed: 'Needs attention' }"
    />
    <MText>{{ inspected }}</MText>
    <MButton
      text="Inspect retained file"
      @click="inspected = files.hasFile('brief') ? 'Has resource' : 'Metadata only'"
    />
    <MButton text="Remove brief from owner" @click="files.remove('brief')" />
    <MButton text="Clear all" @click="files.clear()" />
    <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
  </MColumn>
</template>
