<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MAlert,
  MBadge,
  MStack,
  MProgress,
  MSeparator,
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
const done = ref(['imagine'])
const milestones = [
  {
    id: 'imagine',
    title: 'Find the spark',
    detail: 'One idea worth making room for.',
    icon: 'sparkles',
  },
  {
    id: 'shape',
    title: 'Give it a shape',
    detail: 'A name, a direction, a first draft.',
    icon: 'pencil',
  },
  {
    id: 'share',
    title: 'Put it into the world',
    detail: 'Small steps become something real.',
    icon: 'send',
  },
] as const
function toggle(id: string) {
  done.value = done.value.includes(id)
    ? done.value.filter((value) => value !== id)
    : [...done.value, id]
}
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
        <m-text variant="overline" tone="accent">YOUR PERSONAL CREATIVE SPACE.</m-text>
        <m-text as="h1" variant="display">Good things start here.</m-text>
        <m-text tone="muted"
          >Collect an idea, find your rhythm, and make a little progress every day.</m-text
        >
      </m-column>
      <m-stack
        direction="column"
        :responsive="{ at: 800, direction: 'row', align: 'start' }"
        gap="lg"
      >
        <m-column :grow="1" :shrink="1" gap="lg">
          <m-card :backgroundColor="theme.colors.primarySoft" gap="lg">
            <m-row justify="between" gap="sm" wrap>
              <m-badge text="IN THE MAKING" tone="primary" />
              <m-icon name="sunrise" :size="36" tone="primary" />
            </m-row>
            <m-text variant="title">{{ name.trim() || 'Your next chapter' }}</m-text>
            <m-text tone="muted">A little momentum goes a long way.</m-text>
            <m-progress label="Your momentum" :value="done.length" :max="3" />
          </m-card>
          <m-column gap="sm">
            <m-row justify="between"
              ><m-text variant="heading">Make a little room.</m-text
              ><m-badge :text="`${done.length} / 3`"
            /></m-row>
            <m-card v-for="step in milestones" :key="step.id" padding="md" gap="sm">
              <m-row gap="md" align="center">
                <m-button
                  :icon="done.includes(step.id) ? 'check' : step.icon"
                  :variant="done.includes(step.id) ? 'primary' : 'secondary'"
                  :accessibilityLabel="`${done.includes(step.id) ? 'Undo' : 'Complete'}: ${step.title}`"
                  @click="toggle(step.id)"
                />
                <m-column :grow="1" :shrink="1" gap="xs"
                  ><m-text weight="600">{{ step.title }}</m-text
                  ><m-text variant="caption" tone="muted">{{ step.detail }}</m-text></m-column
                >
              </m-row>
            </m-card>
          </m-column>
        </m-column>
        <m-card :grow="1" :shrink="1" gap="lg">
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
      </m-stack>
      <m-separator />
      <m-row gap="sm" wrap>
        <m-icon name="layers" tone="accent" />
        <m-text variant="caption" tone="muted">One screen. Your theme. Your platform.</m-text>
      </m-row>
    </m-column>
  </m-screen>
</template>
