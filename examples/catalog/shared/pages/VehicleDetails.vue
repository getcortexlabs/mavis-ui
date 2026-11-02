<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref, onBeforeUnmount } from 'vue'
import { useCatalog } from '../context'

const { t } = useCatalogLocale()

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
      <m-button variant="ghost" @click="navigation.back('/showcase/vehicle')">{{
        t('← Veículo')
      }}</m-button>
      <m-column gap="sm">
        <m-text variant="overline" tone="muted">{{ t('SEM PRESSA. SEM RUÍDO.') }}</m-text>
        <m-text variant="title" as="h1">{{ t('Seu próximo caminho.') }}</m-text>
        <m-text tone="muted">{{ t('Uma experiência feita para acompanhar você.') }}</m-text>
      </m-column>
      <m-card gap="lg">
        <m-text variant="heading" as="h2">{{ t('Visão geral') }}</m-text>
        <m-row justify="between">
          <m-text tone="muted">{{ t('Autonomia') }}</m-text
          ><m-text>{{ t('328 km') }}</m-text>
        </m-row>
        <m-row justify="between">
          <m-text tone="muted">{{ t('Bateria') }}</m-text
          ><m-text>82%</m-text>
        </m-row>
        <m-row justify="between">
          <m-text tone="muted">{{ t('Próxima revisão') }}</m-text
          ><m-text>{{ t('Em dia') }}</m-text>
        </m-row>
      </m-card>
      <m-button :loading="syncing" :loadingText="t('Sincronizando…')" @click="sync">
        {{ t(synced ? 'Sincronizado' : 'Sincronizar') }}
      </m-button>
      <m-button disabled variant="secondary">{{ t('Atualização indisponível') }}</m-button>
      <m-text variant="caption" tone="muted">{{
        t('Dados de demonstração. Nenhum veículo está conectado.')
      }}</m-text>
    </m-column>
  </m-screen>
</template>
