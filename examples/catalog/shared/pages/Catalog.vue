<script setup lang="ts">
import { components } from '../catalog'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog()
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between">
        <m-text variant="overline" tone="muted">MAVIS UI</m-text>
        <ThemeSwitch />
      </m-row>
      <m-column gap="sm">
        <m-text as="h1" variant="title">Componentes</m-text>
        <m-text tone="muted">Explore as variações. Ajuste os detalhes. Encontre o seu tema.</m-text>
      </m-column>
      <m-button variant="secondary" @click="navigation.push('/showcase')">Showcase ↗</m-button>
      <m-column gap="md">
        <m-card v-for="item in components" :key="item.id" gap="sm" padding="md">
          <m-row justify="between" gap="sm">
            <m-text variant="heading">{{ item.name }}</m-text>
            <m-button
              size="sm"
              variant="ghost"
              :accessibilityLabel="`Explorar ${item.name}`"
              @click="navigation.push(`/components/${item.id}`)"
              >↗</m-button
            >
          </m-row>
          <m-text variant="caption" tone="muted">{{ item.description }}</m-text>
          <m-text variant="overline" tone="primary">{{ item.tag }}</m-text>
        </m-card>
      </m-column>
      <m-text variant="caption" tone="muted">API experimental · NativeScript + Vue Web</m-text>
    </m-column>
  </m-screen>
</template>
