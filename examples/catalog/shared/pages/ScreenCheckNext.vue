<script setup lang="ts">
import { useCatalog } from '../context'
const { navigation } = useCatalog()
</script>

<template>
  <m-screen id="screen-next">
    <m-column padding="lg" gap="lg">
      <m-text as="h1" variant="title">Outra tela.</m-text>
      <m-button id="return-screen" @click="navigation.back('/checks/screen')"
        >Voltar à edição</m-button
      >
    </m-column>
  </m-screen>
</template>
