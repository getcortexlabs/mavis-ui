<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { theme } = useMavisTheme()
const { navigation } = useCatalog()
const ambiences: ChoiceOption[] = [
  { value: 'silence', label: 'Silêncio', helperText: 'Espaço para uma coisa de cada vez.' },
  { value: 'rain', label: 'Chuva', helperText: 'Um ritmo constante para acompanhar você.' },
]
const ambience = ref<ChoiceValue>('silence')
const minutes = ref(30)
const details = ref(false)
const loading = ref(false)
const ready = ref(false)
const summary = computed(
  () =>
    `${minutes.value} minutos · ${ambiences.find((option) => option.value === ambience.value)?.label}`,
)
let pending: ReturnType<typeof setTimeout> | undefined

function prepare() {
  loading.value = true
  pending = setTimeout(() => {
    loading.value = false
    ready.value = true
  }, 600)
}

function choose(value: ChoiceValue) {
  ambience.value = value
  ready.value = false
}

onUnmounted(() => clearTimeout(pending))
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg" class="showcase-container">
      <m-row justify="between" gap="sm">
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <ThemeSwitch />
      </m-row>
      <m-box :height="180" radius="lg" :backgroundColor="theme.colors.primarySoft">
        <m-column padding="lg" justify="between">
          <m-text variant="overline" tone="primary">UM TEMPO PARA VOCÊ</m-text>
          <m-text as="h1" variant="title">Seu momento.</m-text>
          <m-text tone="muted">Uma pausa. Uma coisa de cada vez.</m-text>
        </m-column>
      </m-box>
      <m-card>
        <m-radio-group
          :modelValue="ambience"
          :options="ambiences"
          label="Escolha o ambiente"
          :disabled="loading"
          @update:modelValue="choose"
        />
      </m-card>
      <m-card gap="md">
        <m-row justify="between" gap="sm">
          <m-text as="h2" variant="heading">Sua sessão</m-text>
          <m-text tone="primary">{{ minutes }} min</m-text>
        </m-row>
        <m-slider
          v-model="minutes"
          :min="15"
          :max="60"
          :step="15"
          :disabled="loading"
          label="Duração da sessão"
          @update:modelValue="ready = false"
        />
        <m-button variant="secondary" @click="details = !details">{{
          details ? 'Ocultar detalhes' : 'Ver detalhes'
        }}</m-button>
        <m-reveal
          :show="details"
          gap="sm"
          padding="md"
          radius="md"
          :backgroundColor="theme.colors.elevated"
        >
          <m-text>{{ summary }}</m-text>
          <m-text variant="caption" tone="muted"
            >Uma demonstração de preferências. Nenhum áudio será reproduzido.</m-text
          >
        </m-reveal>
      </m-card>
      <m-button :loading="loading" loadingText="Preparando…" @click="prepare"
        >Preparar sessão</m-button
      >
      <m-text v-if="ready" tone="primary">Sessão pronta: {{ summary }}.</m-text>
    </m-column>
  </m-screen>
</template>
