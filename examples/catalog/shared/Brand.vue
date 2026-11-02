<script setup lang="ts">
import { useCatalogLocale } from './locale'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t } = useCatalogLocale()

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
      <m-text variant="heading" tone="onPrimary">{{ t('M') }}</m-text>
    </m-column>
    <m-column gap="none">
      <m-text variant="heading">{{ t('Mavis UI') }}</m-text>
      <m-text variant="overline" tone="muted">{{ t('UI KIT') }}</m-text>
    </m-column>
  </m-row>
</template>
