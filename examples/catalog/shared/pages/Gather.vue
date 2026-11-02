<script setup lang="ts">
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import StepsDemo from '../demos/StepsDemo.vue'
import PaginationDemo from '../demos/PaginationDemo.vue'
import ThemeSwitch from '../ThemeSwitch.vue'
const { theme } = useMavisTheme()
const { navigation } = useCatalog()
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl" class="showcase-container">
      <m-row justify="between" gap="sm"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        ><ThemeSwitch
      /></m-row>
      <m-column padding="xl" radius="lg" gap="lg" :backgroundColor="theme.colors.primarySoft">
        <m-row justify="between" gap="md"
          ><m-text variant="overline" tone="primary">11 / GATHER</m-text
          ><m-icon name="calendar" :size="32" tone="primary"
        /></m-row>
        <m-text as="h1" variant="display">Junte boas ideias.</m-text>
        <m-text tone="muted">Um dia, um lugar, algo para compartilhar.</m-text>
        <m-row gap="sm" wrap
          ><m-badge text="ENCONTROS" /><m-badge text="NOVAS IDEIAS" tone="accent"
        /></m-row>
      </m-column>
      <m-card gap="lg" padding="lg"><StepsDemo /></m-card>
      <m-column gap="sm"
        ><m-text variant="overline" tone="accent">O PRÓXIMO DESTINO</m-text
        ><m-text variant="title">Perto de uma boa ideia.</m-text
        ><m-text tone="muted">Encontre o lugar do próximo encontro.</m-text></m-column
      >
      <PaginationDemo />
      <m-text variant="caption" tone="muted"
        >Demonstração local. Os dados e arquivos ficam neste dispositivo.</m-text
      >
    </m-column>
  </m-screen>
</template>
