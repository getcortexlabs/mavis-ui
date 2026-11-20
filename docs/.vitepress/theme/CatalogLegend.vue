<script setup>
import { useData } from 'vitepress'
import { releaseVersion } from '../catalog.mjs'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? `A Mavis ${releaseVersion} inclui CLI para Mac e Windows com NativeScript, starters mobile diretos e Jolt RC.17. Os novos hosts são experimentais, com limites de componentes documentados.`
        : `Mavis ${releaseVersion} includes NativeScript Mac and Windows CLI presets, direct mobile starters and Jolt RC.17. The new hosts are experimental, with documented component limits.`
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
