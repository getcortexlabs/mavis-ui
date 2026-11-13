<script setup lang="ts">
import { computed } from 'vue'
import { MScreen, MColumn, MText, MButton, MLink, MEmptyState } from '#mavis'
import { useDirectory } from './directory-store'
const props = defineProps<{ id: string }>()
const directory = useDirectory()
const entry = computed(() => directory.entries.value.find((item) => item.id === props.id))
</script>
<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="lg">
      <MLink id="places-home" href="/" text="All places" />
      <template v-if="entry">
        <MText as="h1" variant="title">{{ entry.name }}</MText>
        <MText tone="muted">{{ entry.city }}</MText>
        <MText>Keep the directory useful by updating the place’s name.</MText>
        <MButton id="edit-place" :href="`/entries/${entry.id}/edit`" text="Edit place" />
      </template>
      <MEmptyState
        v-else
        title="Place not found"
        description="Return to the directory to choose another place."
      />
    </MColumn>
  </MScreen>
</template>
