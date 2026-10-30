<script setup lang="ts">
import ComponentArtwork from './ComponentArtwork.vue'
import type { Dimension } from '@getcortexlabs/mavis-core'

defineProps<{ item: { id: string; name: string; tag: string }; width?: Dimension; grow?: number }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <m-card
    interactive
    padding="sm"
    gap="sm"
    class="component-tile"
    :width="width"
    :grow="grow"
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
