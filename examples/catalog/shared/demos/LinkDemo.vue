<script setup lang="ts">
import { useCatalogLocale } from '../locale'

const { t, locale } = useCatalogLocale()
</script>
<template>
  <m-column gap="md">
    <m-text variant="heading">{{
      t(locale === 'pt' ? 'Continue explorando.' : 'Keep exploring.')
    }}</m-text>
    <m-link href="https://mavis-ui.getcortexlabs.com/" target="_blank">{{
      t(locale === 'pt' ? 'Conheça o Mavis' : 'Meet Mavis')
    }}</m-link>
    <m-button
      href="https://mavis-ui.getcortexlabs.com/guide/"
      target="_blank"
      icon="arrow-up-right"
      >{{ t(locale === 'pt' ? 'Abrir documentação' : 'Open documentation') }}</m-button
    >
    <m-link href="https://mavis-ui.getcortexlabs.com/" disabled>{{
      t(locale === 'pt' ? 'Indisponível' : 'Unavailable')
    }}</m-link>
  </m-column>
</template>
