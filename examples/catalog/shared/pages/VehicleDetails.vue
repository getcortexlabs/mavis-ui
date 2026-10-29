<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useCatalog } from '../context'

const { navigation } = useCatalog()

const syncing = ref(false)
const synced = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function sync() {
  syncing.value = true
  timer = setTimeout(() => {
    syncing.value = false
    synced.value = true
  }, 1200)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-button variant="ghost" @click="navigation.back('/showcase/vehicle')">← Veículo</m-button>
      <m-column gap="sm">
        <m-text variant="overline" tone="muted">SEM PRESSA. SEM RUÍDO.</m-text>
        <m-text variant="title" as="h1">Seu próximo caminho.</m-text>
        <m-text tone="muted">Uma experiência feita para acompanhar você.</m-text>
      </m-column>
      <m-card gap="lg">
        <m-text variant="heading" as="h2">Visão geral</m-text>
        <m-row justify="between">
          <m-text tone="muted">Autonomia</m-text><m-text>328 km</m-text>
        </m-row>
        <m-row justify="between"> <m-text tone="muted">Bateria</m-text><m-text>82%</m-text> </m-row>
        <m-row justify="between">
          <m-text tone="muted">Próxima revisão</m-text><m-text>Em dia</m-text>
        </m-row>
      </m-card>
      <m-button :loading="syncing" loadingText="Sincronizando…" @click="sync">
        {{ synced ? 'Sincronizado' : 'Sincronizar' }}
      </m-button>
      <m-button disabled variant="secondary">Atualização indisponível</m-button>
      <m-text variant="caption" tone="muted"
        >Dados de demonstração. Nenhum veículo está conectado.</m-text
      >
    </m-column>
  </m-screen>
</template>
