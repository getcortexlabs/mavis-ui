<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? 'Atualizado: melhorias de movimento para a próxima versão, em desenvolvimento. Ainda não incluídas no npm alpha.11.'
        : 'Updated: motion improvements for the next release, in development. Not yet included in npm alpha.11.'
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
