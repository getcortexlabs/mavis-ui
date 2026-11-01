<script setup lang="ts">
import { ref } from 'vue'
import type { AppearanceMode } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'
import StudioEdition from '../studio/StudioEdition.vue'
import { atelier, atelierNight } from '../studio/theme'
const { navigation } = useCatalog()
const appearance = ref<AppearanceMode>('light')
</script>

<template>
  <m-screen scroll class="studio-screen">
    <m-column padding="md" gap="lg" class="studio-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <ThemeSwitch />
      </m-row>
      <m-theme-provider :theme="atelier" :darkTheme="atelierNight" v-model:appearance="appearance">
        <StudioEdition />
      </m-theme-provider>
    </m-column>
  </m-screen>
</template>
