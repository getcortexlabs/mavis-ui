<script setup lang="ts">
import { componentGroups, findComponent } from '../catalog'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { useCatalog } from '../context'
import Brand from '../Brand.vue'
import ComponentTile from '../ComponentTile.vue'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog()
const { theme } = useMavisTheme()
const groups = componentGroups.slice(0, 2).map((group) => ({
  ...group,
  pairs: Array.from({ length: Math.ceil(group.ids.length / 2) }, (_, index) =>
    group.ids.slice(index * 2, index * 2 + 2).map((id) => findComponent(id)!),
  ),
}))
</script>

<template>
  <m-screen scroll class="catalog-page">
    <m-column padding="lg" gap="xl" class="catalog-container">
      <m-row justify="between" gap="sm">
        <Brand />
        <ThemeSwitch />
      </m-row>

      <m-column gap="lg" class="catalog-intro">
        <m-column gap="sm">
          <m-text variant="overline" tone="primary">UMA BASE. A SUA IDENTIDADE.</m-text>
          <m-text as="h1" variant="title">Componentes</m-text>
          <m-text tone="muted">Explore os detalhes. Crie do seu jeito.</m-text>
        </m-column>
        <m-row gap="xs" :accessibilityHidden="true">
          <m-box
            :height="4"
            :grow="3"
            :width="0"
            radius="full"
            :backgroundColor="theme.colors.primary"
          />
          <m-box
            :height="4"
            :grow="2"
            :width="0"
            radius="full"
            :backgroundColor="theme.colors.accent"
          />
          <m-box
            :height="4"
            :grow="1"
            :width="0"
            radius="full"
            :backgroundColor="theme.colors.primarySoft"
          />
        </m-row>
      </m-column>

      <m-row
        padding="md"
        gap="sm"
        radius="md"
        :backgroundColor="theme.colors.accentSoft"
        class="catalog-showcase-link"
      >
        <m-column :grow="1" width="45%" gap="xs">
          <m-text variant="overline" tone="accent">EM CONTEXTO</m-text>
          <m-text variant="caption">Componentes em ação.</m-text>
        </m-column>
        <m-button size="sm" variant="ghost" :shrink="0" @click="navigation.push('/showcase')"
          >Showcase ↗</m-button
        >
      </m-row>

      <m-column v-for="(group, index) in groups" :key="group.name" gap="md">
        <m-row justify="between">
          <m-text variant="heading" as="h2">{{ group.name }}</m-text>
          <m-text variant="overline" tone="muted"
            >0{{ index + 1 }} / {{ String(group.ids.length).padStart(2, '0') }}</m-text
          >
        </m-row>
        <m-column gap="md" class="catalog-grid">
          <m-row v-for="(pair, pairIndex) in group.pairs" :key="pairIndex" gap="md" align="stretch">
            <ComponentTile
              v-for="item in pair"
              :key="item.id"
              :item="item"
              width="50%"
              :grow="1"
              @open="navigation.push(`/components/${item.id}`)"
            />
            <m-column v-if="pair.length === 1" width="50%" :grow="1" />
          </m-row>
        </m-column>
      </m-column>

      <m-column gap="md">
        <m-row justify="between">
          <m-text variant="heading" as="h2">Movimento</m-text>
          <m-text variant="overline" tone="muted">03 / 01</m-text>
        </m-row>
        <m-card
          interactive
          padding="lg"
          radius="lg"
          gap="lg"
          :backgroundColor="theme.colors.primarySoft"
          class="catalog-motion"
          accessibilityLabel="Explorar Reveal"
          @click="navigation.push('/components/reveal')"
        >
          <m-row justify="between">
            <m-text variant="overline" tone="primary">M-REVEAL</m-text>
            <m-text variant="heading" tone="accent">✦</m-text>
          </m-row>
          <m-column gap="sm">
            <m-text variant="title">Cada entrada conta.</m-text>
            <m-text tone="muted">Movimento que faz parte da experiência.</m-text>
          </m-column>
          <m-text tone="primary">Explorar Reveal ↗</m-text>
        </m-card>
      </m-column>
      <m-row justify="between" gap="sm">
        <m-text variant="caption" tone="muted">Feito com Mavis UI.</m-text>
        <m-text variant="overline" tone="primary">NATIVE + WEB</m-text>
      </m-row>
    </m-column>
  </m-screen>
</template>
