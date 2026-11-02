<script setup lang="ts">
import { useCatalogLocale } from '../locale'

const { t } = useCatalogLocale()

withDefaults(defineProps<{ lang?: 'en' | 'pt'; back?: boolean }>(), { lang: 'pt' })
defineEmits<{ back: [] }>()
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-button v-if="back" variant="ghost" @click="$emit('back')"
        >← {{ t(lang === 'pt' ? 'Componentes' : 'Components') }}</m-button
      >
      <m-text as="h1" variant="title">{{
        t(lang === 'pt' ? 'Uma tela inteira.' : 'A whole screen.')
      }}</m-text>
      <m-text tone="muted">{{
        t(lang === 'pt' ? 'Role para explorar o conteúdo.' : 'Scroll to explore the content.')
      }}</m-text>
      <m-card v-for="item in 6" :key="item" gap="sm">
        <m-text variant="heading"
          >{{ t(lang === 'pt' ? 'Seção' : 'Section') }} {{ t(item) }}</m-text
        >
        <m-text tone="muted">{{
          t(
            lang === 'pt'
              ? 'O tema acompanha a tela e seus componentes.'
              : 'The theme follows the screen and its components.',
          )
        }}</m-text>
      </m-card>
      <slot />
    </m-column>
  </m-screen>
</template>
