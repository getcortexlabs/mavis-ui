<script setup lang="ts">
import { useMavisTheme } from '@mavis-ui/core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { theme } = useMavisTheme()
const { locked, climate, temperature, preferences, chargeLimit, navigation } = useCatalog()
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-button size="sm" variant="ghost" @click="navigation.back('/showcase')"
        >← Showcase</m-button
      >
      <m-row justify="between">
        <m-text variant="overline" tone="muted">SHOWCASE / VEÍCULO</m-text>
        <ThemeSwitch />
      </m-row>

      <m-column gap="xs">
        <m-text variant="title" as="h1">O dia é seu.</m-text>
        <m-text tone="muted">Tudo pronto para a próxima partida.</m-text>
      </m-column>

      <m-column gap="sm" paddingY="sm">
        <m-row align="end" gap="sm">
          <m-text variant="display">328</m-text>
          <m-text tone="muted">km de autonomia</m-text>
        </m-row>
        <m-row gap="xs" accessibilityLabel="Bateria em 82 por cento">
          <m-box
            v-for="bar in 24"
            :key="bar"
            :grow="1"
            :height="7"
            :radius="3"
            :backgroundColor="bar <= 20 ? theme.colors.primary : theme.colors.elevated"
          />
        </m-row>
        <m-row justify="between">
          <m-text variant="caption" tone="muted">BATERIA · 82%</m-text>
          <m-text variant="caption" tone="accent">Em boa companhia.</m-text>
        </m-row>
      </m-column>

      <m-card gap="lg">
        <m-row justify="between">
          <m-text variant="overline" tone="muted">SEU ESPAÇO</m-text>
          <m-text variant="caption" :tone="climate ? 'accent' : 'muted'">
            {{ climate ? 'Clima ligado' : 'Clima desligado' }}
          </m-text>
        </m-row>
        <m-column gap="xs" paddingY="sm">
          <m-text variant="display" align="center">{{ temperature }}°</m-text>
          <m-text align="center" tone="muted">Na sua temperatura.</m-text>
        </m-column>
        <m-column gap="xs">
          <m-slider
            v-model="temperature"
            :min="16"
            :max="28"
            :step="0.5"
            :disabled="!climate"
            label="Temperatura da cabine"
          />
          <m-row justify="between">
            <m-text variant="caption" tone="muted">16°</m-text>
            <m-text variant="caption" tone="muted">28°</m-text>
          </m-row>
        </m-column>
        <m-row gap="sm">
          <m-button
            :grow="1"
            :variant="climate ? 'primary' : 'secondary'"
            @click="climate = !climate"
          >
            {{ climate ? 'Desligar clima' : 'Ligar clima' }}
          </m-button>
          <m-button
            variant="secondary"
            accessibilityLabel="Preferências de carregamento"
            @click="preferences = !preferences"
          >
            {{ preferences ? 'Fechar' : 'Ajustes' }}
          </m-button>
        </m-row>
      </m-card>

      <m-reveal :show="preferences">
        <m-card gap="md">
          <m-row justify="between">
            <m-text variant="heading" as="h2">Carga ideal</m-text>
            <m-text tone="primary">{{ chargeLimit }}%</m-text>
          </m-row>
          <m-text variant="caption" tone="muted">Defina o limite para a próxima recarga.</m-text>
          <m-slider
            v-model="chargeLimit"
            :min="50"
            :max="100"
            :step="5"
            label="Limite de carregamento"
          />
        </m-card>
      </m-reveal>

      <m-row gap="sm">
        <m-button :grow="1" variant="secondary" @click="locked = !locked">
          {{ locked ? 'Destrancar' : 'Trancar' }}
        </m-button>
        <m-button :grow="1" variant="ghost" @click="navigation.push('/showcase/vehicle/details')"
          >Meu veículo ↗</m-button
        >
      </m-row>
      <m-text variant="caption" tone="muted" align="center">
        {{ locked ? 'Veículo trancado' : 'Veículo destrancado' }} · Demonstração
      </m-text>
    </m-column>
  </m-screen>
</template>
