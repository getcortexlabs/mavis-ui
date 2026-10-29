<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { mavis, midnight } from '@mavis-ui/core'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { useCatalog } from '../context'

const { theme, setTheme } = useMavisTheme()
const { navigation } = useCatalog()
const dark = computed(() => theme.value.appearance === 'dark')
const details = ref(false)
const loading = ref(false)
const ready = ref(false)
const count = ref(0)
const temperature = ref(21)
const partial = ref(1)
let pending: ReturnType<typeof setTimeout>
function prepare() {
  loading.value = true
  ready.value = false
  pending = setTimeout(() => {
    loading.value = false
    ready.value = true
  }, 3000)
}
onUnmounted(() => clearTimeout(pending))
</script>

<template>
  <m-screen id="accessibility-check" scroll>
    <m-column padding="lg" gap="lg">
      <m-text as="h1" variant="title">Acessibilidade</m-text>
      <m-row gap="sm" wrap>
        <m-button
          id="theme"
          size="sm"
          variant="secondary"
          @click="setTheme(dark ? mavis : midnight)"
        >
          {{ dark ? 'Usar tema claro' : 'Usar tema escuro' }}
        </m-button>
        <m-button
          id="next"
          size="sm"
          variant="ghost"
          @click="navigation.push('/checks/accessibility/next')"
          >Outra tela</m-button
        >
      </m-row>
      <m-box :height="160" padding="md" radius="md" :backgroundColor="theme.colors.accentSoft">
        <m-text accessibilityHidden align="right">✦</m-text>
      </m-box>
      <m-text tone="accent">Texto visível e legível.</m-text>
      <m-card
        id="action-card"
        interactive
        accessibilityLabel="Adicionar favorito"
        gap="sm"
        @click="count++"
      >
        <m-text as="h2" variant="heading">Uma ação no cartão inteiro</m-text>
        <m-text tone="muted">Título e descrição pertencem à mesma ação.</m-text>
      </m-card>
      <m-text id="count">Favoritos: {{ count }}</m-text>
      <m-card id="passive-card" gap="md">
        <m-text as="h2" variant="heading">Controles independentes</m-text>
        <m-slider
          id="temperature"
          v-model="temperature"
          :min="16"
          :max="28"
          :step="0.1"
          label="Temperatura"
        />
        <m-text id="temperature-value">{{ temperature }} graus</m-text>
        <m-slider
          id="partial"
          v-model="partial"
          :min="0"
          :max="1"
          :step="0.3"
          label="Passo final"
        />
        <m-button id="details" variant="secondary" @click="details = !details">{{
          details ? 'Ocultar detalhes' : 'Ver detalhes'
        }}</m-button>
        <m-reveal id="revealed" :show="details" gap="sm">
          <m-text>Detalhes disponíveis.</m-text>
          <m-button id="close-details" size="sm" @click="details = false">Fechar detalhes</m-button>
        </m-reveal>
      </m-card>
      <m-button id="prepare" :loading="loading" loadingText="Preparando…" @click="prepare"
        >Preparar sessão</m-button
      >
      <m-text v-if="ready">Sessão pronta.</m-text>
      <m-button id="disabled-button" disabled>Botão indisponível</m-button>
      <m-card id="disabled-card" interactive disabled accessibilityLabel="Cartão indisponível">
        <m-text>Indisponível</m-text>
      </m-card>
      <m-slider id="disabled-slider" :modelValue="25" disabled label="Volume indisponível" />
    </m-column>
  </m-screen>
</template>
