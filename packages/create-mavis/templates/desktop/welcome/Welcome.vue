<script setup lang="ts">
import { ref } from 'vue'
import { MScreen, MColumn, MRow, MText, MInput, MButton, MReveal, MAlert } from '#mavis'
import { useProjectService } from './services'
const service = useProjectService()
const name = ref('A new beginning'),
  count = ref(0),
  saving = ref(false),
  saved = ref(false),
  error = ref('')
async function save() {
  if (saving.value || !name.value.trim()) return
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    await service.save(name.value.trim())
    saved.value = true
  } catch {
    error.value = 'Could not save. Your draft is still here; try again.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="lg">
      <MText variant="title">__MAVIS_NAME__</MText>
      <MText tone="muted">One Vue screen, native controls on every selected platform.</MText>
      <MInput
        id="project-name"
        v-model="name"
        label="Project name"
        @submit="save"
        @update:modelValue="saved = false"
      />
      <MText id="greeting">{{ name }}</MText>
      <MRow gap="md">
        <MButton id="increment" :text="`Count ${count}`" @click="count++" />
        <MButton
          id="save-project"
          text="Save project"
          :disabled="!name.trim()"
          :loading="saving"
          loadingText="Saving…"
          @click="save"
        />
      </MRow>
      <MAlert v-if="error" title="Save failed" :description="error" />
      <MReveal :show="saved"
        ><MText id="saved" tone="success">Your project is saved.</MText></MReveal
      >
    </MColumn>
  </MScreen>
</template>
