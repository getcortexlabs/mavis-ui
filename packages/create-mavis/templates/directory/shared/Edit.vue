<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  MScreen,
  MColumn,
  MText,
  MInput,
  MButton,
  MLink,
  MAlert,
  MReveal,
  MEmptyState,
} from '#mavis'
import { useDirectory } from './directory-store'
const props = defineProps<{ id: string }>()
const directory = useDirectory()
const entry = computed(() => directory.entries.value.find((item) => item.id === props.id))
const name = ref(entry.value?.name ?? '')
const dirty = ref(false),
  saving = ref(false),
  saved = ref(false),
  error = ref('')
watch(
  () => entry.value?.name ?? '',
  (value) => {
    if (!dirty.value) name.value = value
  },
)
watch(
  () => props.id,
  () => {
    name.value = entry.value?.name ?? ''
    dirty.value = false
    saved.value = false
    error.value = ''
  },
)
function edit() {
  dirty.value = true
  saved.value = false
}
async function save() {
  if (saving.value || !name.value.trim()) return
  const id = props.id
  const draft = name.value
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await directory.save(id, draft)
    if (props.id === id) {
      saved.value = name.value === draft
      dirty.value = name.value !== draft
    }
  } catch {
    if (props.id === id) error.value = 'Could not save. Your draft is still here; try again.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="lg">
      <MLink :href="`/entries/${id}`" text="Place details" />
      <template v-if="entry">
        <MText as="h1" variant="title">Edit place</MText>
        <MInput
          id="place-name"
          v-model="name"
          label="Place name"
          :readonly="saving"
          @update:modelValue="edit"
          @submit="save"
        />
        <MAlert
          id="save-error"
          v-if="error"
          tone="error"
          title="Save failed"
          :description="error"
        />
        <MButton
          id="save-place"
          text="Save changes"
          :loading="saving"
          loadingText="Saving…"
          :disabled="!name.trim()"
          @click="save"
        />
        <MReveal :show="saved">
          <MText tone="success">Changes saved.</MText>
        </MReveal>
      </template>
      <MEmptyState
        v-else
        title="Place not found"
        description="Choose a place from the directory."
      />
    </MColumn>
  </MScreen>
</template>
