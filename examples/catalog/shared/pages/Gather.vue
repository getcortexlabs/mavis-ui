<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import StepsDemo from '../demos/StepsDemo.vue'
import PaginationDemo from '../demos/PaginationDemo.vue'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t } = useCatalogLocale()

const { theme } = useMavisTheme()
const { navigation } = useCatalog()
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl" class="showcase-container">
      <m-row justify="between" gap="sm"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')">{{
          t('← Showcase')
        }}</m-button
        ><ThemeSwitch
      /></m-row>
      <m-column padding="xl" radius="lg" gap="lg" :backgroundColor="theme.colors.primarySoft">
        <m-row justify="between" gap="md"
          ><m-text variant="overline" tone="primary">{{ t('11 / GATHER') }}</m-text
          ><m-icon name="calendar" :size="32" tone="primary"
        /></m-row>
        <m-text as="h1" variant="display">{{ t('Junte boas ideias.') }}</m-text>
        <m-text tone="muted">{{ t('Um dia, um lugar, algo para compartilhar.') }}</m-text>
        <m-row gap="sm" wrap
          ><m-badge :text="t('ENCONTROS')" /><m-badge :text="t('NOVAS IDEIAS')" tone="accent"
        /></m-row>
      </m-column>
      <m-card gap="lg" padding="lg"><StepsDemo /></m-card>
      <m-column gap="sm"
        ><m-text variant="overline" tone="accent">{{ t('O PRÓXIMO DESTINO') }}</m-text
        ><m-text variant="title">{{ t('Perto de uma boa ideia.') }}</m-text
        ><m-text tone="muted">{{ t('Encontre o lugar do próximo encontro.') }}</m-text></m-column
      >
      <PaginationDemo />
      <m-text variant="caption" tone="muted">{{
        t('Demonstração local. Os dados e arquivos ficam neste dispositivo.')
      }}</m-text>
    </m-column>
  </m-screen>
</template>
