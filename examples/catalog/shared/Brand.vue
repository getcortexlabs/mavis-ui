<script setup lang="ts">
import { useMavisTheme } from '@mavis-ui/core/vue'
const { theme } = useMavisTheme()
</script>

<template>
  <m-row gap="sm">
    <m-column
      :width="40"
      :height="40"
      radius="sm"
      align="center"
      justify="center"
      :backgroundColor="theme.colors.primary"
      :accessibilityHidden="true"
    >
      <m-text variant="heading" tone="onPrimary">M</m-text>
    </m-column>
    <m-column gap="none">
      <m-text variant="heading">Mavis UI</m-text>
      <m-text variant="overline" tone="muted">UI KIT</m-text>
    </m-column>
  </m-row>
</template>
