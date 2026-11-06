<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? 'Novo e Atualizado identificam mudanças da Mavis 0.1.0-rc.11.1. Os seis componentes de interação com telas estão em desenvolvimento para a próxima versão.'
        : 'New and Updated identify changes in Mavis 0.1.0-rc.11.1. The six screen interaction components are in development for the next release.'
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
