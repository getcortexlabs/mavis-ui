<script setup lang="ts">
import { useCatalog } from '../context'
const { navigation } = useCatalog()
</script>

<template>
  <m-screen>
    <m-column padding="lg" gap="lg">
      <m-text as="h1" variant="title">Destino da navegação</m-text>
      <m-button @click="navigation.back('/checks/accessibility')">Voltar à acessibilidade</m-button>
    </m-column>
  </m-screen>
</template>
