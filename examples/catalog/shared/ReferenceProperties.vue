<script setup lang="ts">
import type { ReferenceProperty } from './reference'
import { useMavisTheme } from '@mavis-ui/core/vue'
defineProps<{ properties: ReferenceProperty[] }>()
const { theme } = useMavisTheme()
</script>

<template>
  <m-card padding="md" gap="sm">
    <template v-for="(property, index) in properties" :key="property.name">
      <m-row gap="sm" justify="between" wrap>
        <m-text tone="primary">{{ property.name }}</m-text>
        <m-text
          variant="caption"
          tone="muted"
          :style="{
            paddingLeft: theme.space.sm,
            paddingRight: theme.space.sm,
            paddingTop: theme.space.xs,
            paddingBottom: theme.space.xs,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.elevated,
          }"
          >{{ property.defaultValue }}</m-text
        >
      </m-row>
      <m-text variant="caption" tone="accent">{{ property.type }}</m-text>
      <m-text variant="caption" tone="muted">{{ property.description }}</m-text>
      <m-box v-if="index < properties.length - 1" :height="17">
        <m-box :height="1" :backgroundColor="theme.colors.border" />
      </m-box>
    </template>
  </m-card>
</template>
