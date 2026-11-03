<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MAlert,
  MButton,
  MCard,
  MColumn,
  MIcon,
  MInput,
  MReveal,
  MRow,
  MScreen,
  MText,
  useMavisTheme,
} from '#mavis'
import { useProjectService } from './services'

const { theme, setAppearance } = useMavisTheme()
const service = useProjectService()
const name = ref('A new beginning')
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const canSave = computed(() => name.value.trim().length > 0)
async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  saved.value = false
  error.value = ''
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
  <m-screen scroll>
    <m-column padding="lg" gap="xl">
      <m-row justify="between" gap="md" wrap>
        <m-column gap="xs">
          <m-text variant="overline" tone="primary">__MAVIS_NAME__</m-text>
          <m-text variant="caption" tone="muted">Made with Mavis</m-text>
        </m-column>
        <m-button
          variant="ghost"
          size="sm"
          :icon="theme.appearance === 'dark' ? 'sun' : 'moon'"
          accessibilityLabel="Change appearance"
          @click="setAppearance(theme.appearance === 'dark' ? 'light' : 'dark')"
        />
      </m-row>
      <m-column paddingY="xl" gap="md">
        <m-text variant="overline" tone="accent">A LITTLE SPACE. A BIG IDEA.</m-text>
        <m-text as="h1" variant="display">Make room for what’s next.</m-text>
        <m-text tone="muted">Your first screen is ready. Give your next project a name.</m-text>
      </m-column>
      <m-card gap="lg">
        <m-row justify="between" gap="sm">
          <m-text variant="heading">Start something</m-text>
          <m-icon name="sparkles" tone="primary" />
        </m-row>
        <m-input
          v-model="name"
          label="Project name"
          name="project-name"
          autocomplete="off"
          helperText="A small beginning is still a beginning."
          @update:modelValue="saved = false"
          @submit="save"
        />
        <m-alert v-if="error" tone="error" title="Let’s try again" :description="error" />
        <m-button
          :disabled="!canSave"
          :loading="saving"
          loadingText="Saving…"
          icon="arrow-right"
          @click="save"
          >Create project</m-button
        >
        <m-reveal :show="saved">
          <m-text tone="success"
            >Your draft is ready. Connect the host service to make it yours.</m-text
          >
        </m-reveal>
      </m-card>
      <m-row gap="sm" wrap>
        <m-icon name="layers" tone="accent" />
        <m-text variant="caption" tone="muted">One screen. Your theme. Your platform.</m-text>
      </m-row>
    </m-column>
  </m-screen>
</template>
