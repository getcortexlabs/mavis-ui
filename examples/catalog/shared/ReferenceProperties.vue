<script setup lang="ts">
import type { ReferenceProperty } from './reference'
import { useMavisTheme } from '@mavis-ui/core/vue'
defineProps<{ properties: ReferenceProperty[] }>()
const { theme } = useMavisTheme()
</script>

<template>
  <m-card padding="md" gap="lg">
    <m-column v-for="(property, index) in properties" :key="property.name" gap="sm">
      <m-row gap="sm" justify="between" wrap>
        <m-text tone="primary">{{ property.name }}</m-text>
        <m-column paddingX="sm" paddingY="xs" radius="sm" :backgroundColor="theme.colors.elevated">
          <m-text variant="caption" tone="muted">{{ property.defaultValue }}</m-text>
        </m-column>
      </m-row>
      <m-text variant="caption" tone="accent">{{ property.type }}</m-text>
      <m-text variant="caption" tone="muted">{{ property.description }}</m-text>
      <m-box
        v-if="index < properties.length - 1"
        :height="1"
        :backgroundColor="theme.colors.border"
      />
    </m-column>
  </m-card>
</template>
