<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const saved = ref(false)
</script>

<template>
  <m-card gap="md">
    <m-text variant="overline" tone="muted">COLLECTION / 01</m-text>
    <m-text variant="heading">{{
      lang === 'pt' ? 'Um espaço seu.' : 'A space of your own.'
    }}</m-text>
    <m-text tone="muted">{{
      lang === 'pt'
        ? 'Texto, ações e conteúdo com o mesmo ritmo.'
        : 'Text, actions and content with a shared rhythm.'
    }}</m-text>
    <m-button variant="secondary" @click="saved = !saved">
      {{
        saved
          ? lang === 'pt'
            ? 'Salvo na coleção'
            : 'Saved to collection'
          : lang === 'pt'
            ? 'Salvar na coleção'
            : 'Save to collection'
      }}
    </m-button>
  </m-card>
</template>
