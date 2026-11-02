<script setup lang="ts">
import { useCatalogLocale } from './locale'
import type { ReferenceProperty } from './reference'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t } = useCatalogLocale()

defineProps<{ properties: ReferenceProperty[] }>()
const { theme } = useMavisTheme()
</script>

<template>
  <m-card padding="md" gap="sm">
    <template v-for="(property, index) in properties" :key="property.name">
      <m-row gap="sm" justify="between" wrap>
        <m-text tone="primary">{{ property.name }}</m-text>
        <m-column paddingX="sm" paddingY="xs" radius="sm" :backgroundColor="theme.colors.elevated">
          <m-text variant="caption" tone="muted">{{ property.defaultValue }}</m-text>
        </m-column>
      </m-row>
      <m-text variant="caption" tone="accent">{{ property.type }}</m-text>
      <m-text variant="caption" tone="muted">{{ t(property.description) }}</m-text>
      <m-box v-if="index < properties.length - 1" :height="17">
        <m-box :height="1" :backgroundColor="theme.colors.border" />
      </m-box>
    </template>
  </m-card>
</template>
