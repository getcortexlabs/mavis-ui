<script setup lang="ts">
import { ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import PercentageLayoutCheck from '../PercentageLayoutCheck.vue'

const { theme } = useMavisTheme()
const expanded = ref(false)
const duration = ref(30)
const labels = ['Silêncio', 'Chuva']
const description = 'Preferências de concentração e notificações durante a sessão.'
</script>

<template>
  <m-screen scroll>
    <m-column id="layout-check" :padding="20" :gap="16">
      <m-text as="h1" variant="heading">Layout</m-text>
      <m-button id="change-content" @click="expanded = !expanded">{{
        expanded ? 'Voltar às preferências de concentração' : 'Alterar conteúdo'
      }}</m-button>
      <m-text variant="caption">Porcentagem + espaço</m-text>
      <m-row id="percent-row" :gap="14" align="stretch">
        <m-card
          v-for="(label, index) in labels"
          :id="`percent-${index}`"
          :key="label"
          width="50%"
          :grow="1"
          padding="md"
          gap="sm"
        >
          <m-text variant="heading">{{ label }}</m-text>
          <m-text :id="`percent-body-${index}`">{{
            expanded ? description : 'Experimentar'
          }}</m-text>
        </m-card>
      </m-row>
      <m-text variant="caption">Largura zero + crescimento</m-text>
      <m-row id="grow-row" :gap="14" align="stretch">
        <m-card
          v-for="(label, index) in labels"
          :id="`grow-${index}`"
          :key="label"
          :width="0"
          :grow="1"
          padding="md"
          gap="sm"
        >
          <m-text variant="heading">{{ label }}</m-text>
          <m-text :id="`grow-body-${index}`">{{ expanded ? description : 'Experimentar' }}</m-text>
        </m-card>
      </m-row>
      <m-text variant="caption">Quebra de linha</m-text>
      <m-row id="wrap-row" wrap :gap="9" align="start">
        <m-card v-for="index in 3" :id="`wrap-${index}`" :key="index" :width="120" padding="sm">
          <m-text>{{ expanded ? description : `Opção ${index}` }}</m-text>
        </m-card>
      </m-row>
      <m-text variant="caption">Proporção e sobreposição</m-text>
      <m-row id="ratio-row" :gap="11" align="stretch">
        <m-box
          id="ratio-1"
          :width="0"
          :grow="1"
          :height="80"
          :backgroundColor="theme.colors.primarySoft"
        >
          <m-column padding="sm" justify="center"><m-text align="center">1</m-text></m-column>
        </m-box>
        <m-box
          id="ratio-2"
          :width="0"
          :grow="2"
          :height="80"
          :backgroundColor="theme.colors.accentSoft"
        >
          <m-column padding="sm" justify="center"><m-text align="center">2</m-text></m-column>
        </m-box>
      </m-row>
      <m-row id="shrink-row" :gap="12">
        <m-box
          id="fixed"
          :width="48"
          :height="48"
          :shrink="0"
          radius="md"
          :backgroundColor="theme.colors.primarySoft"
        />
        <m-text id="long-text" :grow="1"
          >{{ description }} Einstellungen für Benachrichtigungen. إعدادات الجلسة</m-text
        >
      </m-row>
      <m-row id="rtl-row" :gap="13" :style="{ direction: 'rtl' }">
        <m-box
          id="rtl-first"
          :width="64"
          :height="40"
          :backgroundColor="theme.colors.primarySoft"
        />
        <m-box
          id="rtl-second"
          :width="64"
          :height="40"
          :backgroundColor="theme.colors.accentSoft"
        />
        <m-text align="right">إعدادات الجلسة</m-text>
      </m-row>
      <m-card id="dynamic-card" padding="md" gap="md">
        <m-text variant="heading">Sua sessão</m-text>
        <m-slider id="duration" v-model="duration" :min="15" :max="60" :step="15" label="Duração" />
        <m-button id="details-toggle" variant="secondary" @click="expanded = !expanded">{{
          expanded ? 'Ocultar detalhes' : 'Ver detalhes'
        }}</m-button>
        <m-reveal id="details" :show="expanded" padding="md" gap="sm">
          <m-text id="revealed">{{ duration }} minutos. Conteúdo atualizado.</m-text>
          <m-text variant="caption">{{ description }}</m-text>
        </m-reveal>
      </m-card>
      <PercentageLayoutCheck :expanded="expanded" />
    </m-column>
  </m-screen>
</template>
