<script setup lang="ts">
import ComponentArtwork from './ComponentArtwork.vue'

defineProps<{ item: { id: string; name: string; tag: string } }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <m-card padding="sm" gap="sm" class="component-tile">
    <ComponentArtwork :id="item.id" />
    <m-column gap="none">
      <m-button
        variant="ghost"
        size="sm"
        :accessibilityLabel="`Explorar ${item.name}`"
        @click="$emit('open')"
        >{{ item.name }} ↗</m-button
      >
      <m-text variant="overline" tone="muted" align="center">{{ item.tag }}</m-text>
    </m-column>
  </m-card>
</template>
