<script setup lang="ts">
import ComponentArtwork from './ComponentArtwork.vue'

defineProps<{ item: { id: string; name: string; tag: string } }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <m-card
    interactive
    padding="sm"
    gap="sm"
    class="component-tile"
    :accessibilityLabel="`Explorar ${item.name}`"
    @click="$emit('open')"
  >
    <ComponentArtwork :id="item.id" />
    <m-column gap="sm" paddingY="sm" :accessibilityHidden="true">
      <m-text variant="heading" align="center">{{ item.name }} ↗</m-text>
      <m-text variant="overline" tone="muted" align="center">{{ item.tag }}</m-text>
    </m-column>
  </m-card>
</template>
