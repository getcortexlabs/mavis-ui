<script setup lang="ts">
import { computed } from 'vue'
import { findComponent } from '../catalog'
import { useCatalog } from '../context'
import { useMavisTheme } from '@mavis-ui/core/vue'
import ThemeSwitch from '../ThemeSwitch.vue'

const props = defineProps<{ id: string }>()
const item = computed(() => findComponent(props.id))
const { navigation } = useCatalog()
const { theme } = useMavisTheme()
</script>

<template>
  <component v-if="item?.id === 'screen'" :is="item.demo" back @back="navigation.back('/')" />
  <m-screen v-else scroll class="component-page">
    <m-column padding="lg" gap="xl" class="component-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/')">← Componentes</m-button>
        <ThemeSwitch />
      </m-row>
      <m-column v-if="item" gap="xl">
        <m-column gap="sm">
          <m-text variant="overline" tone="primary">{{ item.tag }} / MAVIS UI</m-text>
          <m-text as="h1" variant="display">{{ item.name }}</m-text>
          <m-text tone="muted">{{ item.description }}</m-text>
        </m-column>
        <m-column gap="lg" class="component-workspace">
          <m-column gap="md">
            <m-row justify="between">
              <m-text variant="overline" tone="muted">EXPERIMENTE</m-text>
              <m-box :width="7" :height="7" radius="full" :backgroundColor="theme.colors.primary" />
            </m-row>
            <m-card padding="md" class="component-stage">
              <component :is="item.demo" />
            </m-card>
          </m-column>
          <m-column gap="md" class="component-api">
            <m-text variant="overline" tone="muted">REFERÊNCIA</m-text>
            <m-column gap="md" padding="lg" radius="lg" :backgroundColor="theme.colors.accentSoft">
              <m-text variant="heading" as="h2">API</m-text>
              <m-column v-for="(line, index) in item.api" :key="line" gap="md">
                <m-text variant="caption">{{ line }}</m-text>
                <m-box
                  v-if="index < item.api.length - 1"
                  :height="1"
                  :backgroundColor="theme.colors.border"
                />
              </m-column>
            </m-column>
          </m-column>
        </m-column>
      </m-column>
      <m-text v-else>Componente não encontrado.</m-text>
    </m-column>
  </m-screen>
</template>
