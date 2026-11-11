<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? 'A Mavis 0.1.0-rc.13 traz trajetórias, profundidade e sombras no movimento, o exemplo Tasks e projetos com qualquer combinação de Web, Nativo e Mac. Os 92 componentes mantêm suas versões de introdução indicadas nas páginas.'
        : 'Mavis 0.1.0-rc.13 adds motion paths, depth and shadows, the Tasks example and projects with any combination of Web, Native and Mac. The 92 components keep their introduction versions on each page.'
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
