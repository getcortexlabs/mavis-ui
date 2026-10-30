<script setup lang="ts">
import { computed } from 'vue'
import { findComponent } from '../catalog'
import { useCatalog } from '../context'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import ThemeSwitch from '../ThemeSwitch.vue'
import ComponentReference from '../ComponentReference.vue'

const props = defineProps<{ id: string }>()
const item = computed(() => findComponent(props.id))
const { navigation } = useCatalog()
const { theme } = useMavisTheme()
</script>

<template>
  <component v-if="item?.id === 'screen'" :is="item.demo" back @back="navigation.back('/')">
    <ComponentReference :id="id" />
  </component>
  <m-screen v-else scroll class="component-page">
    <m-column padding="lg" gap="xl" class="component-container">
      <m-row justify="between" gap="sm" class="component-navigation">
        <m-button size="sm" variant="ghost" @click="navigation.back('/')">← Componentes</m-button>
        <ThemeSwitch />
      </m-row>
      <template v-if="item">
        <m-column gap="sm" class="component-heading">
          <m-text variant="overline" tone="primary">{{ item.tag }} / MAVIS UI</m-text>
          <m-text as="h1" variant="display">{{ item.name }}</m-text>
          <m-text tone="muted">{{ item.description }}</m-text>
        </m-column>
        <m-column gap="md">
          <m-row justify="between">
            <m-text variant="overline" tone="muted">EXPERIMENTE</m-text>
            <m-box :width="7" :height="7" radius="full" :backgroundColor="theme.colors.primary" />
          </m-row>
          <m-card padding="md" class="component-stage">
            <component :is="item.demo" />
          </m-card>
        </m-column>
        <ComponentReference :id="id" />
      </template>
      <m-text v-else>Componente não encontrado.</m-text>
    </m-column>
  </m-screen>
</template>
