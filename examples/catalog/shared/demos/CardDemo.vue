<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref } from 'vue'

const { t } = useCatalogLocale()

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const saved = ref(false)
</script>

<template>
  <m-card gap="md">
    <m-text variant="overline" tone="muted">{{ t('COLLECTION / 01') }}</m-text>
    <m-text variant="heading">{{
      t(lang === 'pt' ? 'Um espaço seu.' : 'A space of your own.')
    }}</m-text>
    <m-text tone="muted">{{
      t(
        lang === 'pt'
          ? 'Texto, ações e conteúdo com o mesmo ritmo.'
          : 'Text, actions and content with a shared rhythm.',
      )
    }}</m-text>
    <m-button variant="secondary" @click="saved = !saved">
      {{
        t(
          saved
            ? lang === 'pt'
              ? 'Salvo na coleção'
              : 'Saved to collection'
            : lang === 'pt'
              ? 'Salvar na coleção'
              : 'Save to collection',
        )
      }}
    </m-button>
  </m-card>
</template>
