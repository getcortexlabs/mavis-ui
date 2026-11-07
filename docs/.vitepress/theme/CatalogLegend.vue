<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <p class="catalog-legend">
    {{
      lang === 'pt-BR'
        ? 'Novo e Atualizado identificam mudanças da Mavis 0.1.0-rc.12: 18 novos componentes e melhorias em Popover, Carousel e Image. Outros seis estão marcados como em desenvolvimento; confira o aviso de cada página.'
        : 'New and Updated identify changes in Mavis 0.1.0-rc.12: 18 new components and improvements to Popover, Carousel and Image. Six additional components are marked as in development; check each page’s notice.'
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
