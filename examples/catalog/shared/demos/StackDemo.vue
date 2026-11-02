<script setup lang="ts">
import { ref } from 'vue'
import { useCatalogLocale } from '../locale'

const { t, locale } = useCatalogLocale()

const draft = ref('')
</script>
<template>
  <m-stack gap="md" :responsive="{ at: 560, direction: 'row', gap: 'lg' }">
    <m-column :grow="1" gap="sm">
      <m-text variant="heading">{{
        t(locale === 'pt' ? 'Um espaço que acompanha você.' : 'A space that follows you.')
      }}</m-text>
      <m-text tone="muted">{{
        t(
          locale === 'pt'
            ? 'A coluna vira linha quando há espaço. Seu texto continua aqui.'
            : 'The column becomes a row when there is room. Your draft stays here.',
        )
      }}</m-text>
    </m-column>
    <m-input
      v-model="draft"
      :grow="1"
      :label="t(locale === 'pt' ? 'Sua próxima ideia' : 'Your next idea')"
    />
  </m-stack>
</template>
