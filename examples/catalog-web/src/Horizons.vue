<script setup lang="ts">
import HorizonsScene from './HorizonsScene.vue'
import { useCatalogLocale } from '../../catalog/shared/locale'
import ThemeSwitch from '../../catalog/shared/ThemeSwitch.vue'
const { locale } = useCatalogLocale()
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between"><m-link href="#/showcase">← Showcase</m-link><ThemeSwitch /></m-row>
      <HorizonsScene :locale="locale" />
    </m-column>
  </m-screen>
</template>
