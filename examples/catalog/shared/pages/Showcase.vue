<script setup lang="ts">
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog()
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/')">← Componentes</m-button>
        <ThemeSwitch />
      </m-row>
      <m-column gap="sm">
        <m-text as="h1" variant="title">Showcase</m-text>
        <m-text tone="muted">Os componentes em conjunto, em uma experiência completa.</m-text>
      </m-column>
      <m-card gap="lg">
        <m-column gap="xs">
          <m-text variant="overline" tone="primary">CONTROLES DE VEÍCULO</m-text>
          <m-text variant="display">328 km</m-text>
          <m-text tone="muted">Clima, bateria e ações rápidas em duas telas conectadas.</m-text>
        </m-column>
        <m-text variant="caption" tone="muted">Button · Slider · Card · Reveal · Layouts</m-text>
        <m-button @click="navigation.push('/showcase/vehicle')">Explorar veículo ↗</m-button>
      </m-card>
      <m-text variant="caption" tone="muted">Dados locais de demonstração.</m-text>
    </m-column>
  </m-screen>
</template>
