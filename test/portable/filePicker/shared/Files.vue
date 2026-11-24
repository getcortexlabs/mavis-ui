<script setup lang="ts">
import { reactive } from 'vue'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'

const state = reactive({
  locked: false as boolean,
  inspected: 'Not inspected' as string,
})
const files = useFileSelection({
  multiple: true,
  maxCount: 3,
  maxSize: 4096,
  accept: ['.pdf', 'image/*'],
  initial: [
    {
      id: 'brief',
      name: 'Brief.pdf',
      size: 120,
      type: 'application/pdf',
      status: 'uploaded',
      progress: undefined,
      error: undefined,
    },
    {
      id: 'photo',
      name: 'Photo.png',
      size: 240,
      type: 'image/png',
      status: 'failed',
      error: 'Try another connection',
      progress: undefined,
    },
  ],
})
</script>

<template>
  <MColumn gap="md">
    <MFilePicker
      label="Documents"
      :selection="files"
      :disabled="state.locked"
      chooseLabel="Browse documents"
      removeLabel="Forget"
      emptyLabel="Nothing selected"
      :statusLabels="{
        uploaded: 'Stored',
        failed: 'Needs attention',
        selected: undefined,
        uploading: undefined,
        cancelled: undefined,
      }"
    />
    <MText>{{ state.inspected }}</MText>
    <MButton
      text="Inspect retained file"
      @click="() => (state.inspected = files.hasFile('brief') ? 'Has resource' : 'Metadata only')"
    />
    <MButton text="Remove brief from owner" @click="() => files.remove('brief')" />
    <MButton text="Clear all" @click="() => files.clear()" />
    <MButton
      :text="state.locked ? 'Unlock' : 'Lock'"
      @click="() => (state.locked = !state.locked)"
    />
  </MColumn>
</template>
