<script setup lang="ts">
import { useCatalogLocale } from './locale'
import { computed } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { locale, setLanguage, t } = useCatalogLocale()
const { theme, appearance, setAppearance } = useMavisTheme()
const next = computed(() =>
  appearance.value === 'system' ? (theme.value.appearance === 'dark' ? 'light' : 'dark') : 'system',
)
const labels = { system: '◐ Sistema', light: '◐ Claro', dark: '◐ Escuro' }
</script>

<template>
  <m-row gap="xs">
    <m-button
      size="sm"
      variant="ghost"
      :accessibilityLabel="t('Idioma')"
      @click="setLanguage(locale === 'pt' ? 'en' : 'pt')"
      >{{ locale === 'pt' ? 'EN' : 'PT' }}</m-button
    >
    <m-button
      size="sm"
      variant="secondary"
      :accessibilityLabel="t('Trocar tema')"
      @click="setAppearance(next)"
    >
      {{ t(labels[next]) }}
    </m-button>
  </m-row>
</template>
