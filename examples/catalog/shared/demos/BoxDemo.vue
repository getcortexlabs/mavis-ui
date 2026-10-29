<script setup lang="ts">
import { useMavisTheme } from '@mavis-ui/core/vue'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const { theme } = useMavisTheme()
</script>

<template>
  <m-box :height="180" radius="lg" :backgroundColor="theme.colors.elevated">
    <m-column padding="lg">
      <m-text variant="display" tone="primary">01</m-text>
      <m-text variant="caption" tone="muted">{{
        lang === 'pt' ? 'Camada de fundo' : 'Background layer'
      }}</m-text>
    </m-column>
    <m-column align="end" justify="end" padding="md">
      <m-card padding="sm" radius="sm">
        <m-text variant="caption">{{ lang === 'pt' ? 'Por cima' : 'On top' }}</m-text>
      </m-card>
    </m-column>
  </m-box>
</template>
