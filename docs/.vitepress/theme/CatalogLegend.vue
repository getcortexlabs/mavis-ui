<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? 'A Mavis 0.1.0-rc.14 amplia o compartilhamento de telas Vue com o Mac, adiciona o compilador como pacote e integra Jolt RC.15. O alvo Mac continua experimental, com limites por componente na documentação.'
        : 'Mavis 0.1.0-rc.14 expands shared Vue screens to the Mac, packages the compiler and integrates Jolt RC.15. The Mac target remains experimental, with per-component limits documented.'
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
