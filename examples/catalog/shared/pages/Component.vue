<script setup lang="ts">
import { computed } from 'vue'
import { findComponent } from '../catalog'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const props = defineProps<{ id: string }>()
const item = computed(() => findComponent(props.id))
const { navigation } = useCatalog()
</script>

<template>
  <component v-if="item?.id === 'screen'" :is="item.demo" back @back="navigation.back('/')" />
  <m-screen v-else scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/')">← Componentes</m-button>
        <ThemeSwitch />
      </m-row>
      <m-column v-if="item" gap="lg">
        <m-column gap="sm">
          <m-text variant="overline" tone="primary">{{ item.tag }}</m-text>
          <m-text as="h1" variant="title">{{ item.name }}</m-text>
          <m-text tone="muted">{{ item.description }}</m-text>
        </m-column>
        <component :is="item.demo" />
        <m-card gap="sm" padding="md">
          <m-text variant="overline" tone="muted">API</m-text>
          <m-text v-for="line in item.api" :key="line" variant="caption">{{ line }}</m-text>
        </m-card>
      </m-column>
      <m-text v-else>Componente não encontrado.</m-text>
    </m-column>
  </m-screen>
</template>
