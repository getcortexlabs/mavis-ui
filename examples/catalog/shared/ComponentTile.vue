<script setup lang="ts">
import { useCatalogLocale } from './locale'
import ComponentArtwork from './ComponentArtwork.vue'
import type { Dimension } from '@getcortexlabs/mavis-core'

const { t } = useCatalogLocale()

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
    :accessibilityLabel="`${t('Explorar')} ${item.name}`"
    @click="$emit('open')"
  >
    <ComponentArtwork :id="item.id" />
    <m-column gap="sm" paddingY="sm" :accessibilityHidden="true">
      <m-text variant="heading" align="center">{{ t(item.name) }} ↗</m-text>
      <m-text variant="overline" tone="muted" align="center">{{ t(item.tag) }}</m-text>
    </m-column>
  </m-card>
</template>
