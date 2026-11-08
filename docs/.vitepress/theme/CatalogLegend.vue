<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? 'A Mavis 0.1.0-rc.12.2 adiciona o starter macOS experimental. Os 92 componentes existentes não mudaram; suas versões de introdução permanecem indicadas nas páginas.'
        : 'Mavis 0.1.0-rc.12.2 adds the experimental macOS starter. The 92 existing components are unchanged; their introduction versions remain on each page.'
    }}
  </p>
</template>

<style scoped>
.catalog-legend {
  margin: 16px 0;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.6;
}
</style>
