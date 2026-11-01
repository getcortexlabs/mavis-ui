<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const { theme } = useMavisTheme()
const range = ref<ChoiceValue | null>('week')
const disabled = ref(false)
const options = computed(() => [
  { value: 'day', label: pt.value ? 'Dia' : 'Day' },
  { value: 'week', label: pt.value ? 'Semana' : 'Week' },
  { value: 'month', label: pt.value ? 'Mês' : 'Month' },
])
const minutes = computed(() =>
  range.value === 'day' ? '45' : range.value === 'week' ? '280' : '1.240',
)
const bars = computed(() =>
  range.value === 'day'
    ? [30, 65, 45, 88, 60, 100, 75]
    : range.value === 'week'
      ? [40, 70, 95, 55, 90, 125, 105]
      : [75, 45, 105, 85, 115, 95, 135],
)
</script>
<template>
  <m-column id="segmented-demo" gap="lg">
    <m-column gap="sm">
      <m-text variant="overline" tone="accent">{{
        pt ? 'MUDE O PONTO DE VISTA' : 'CHANGE THE PERSPECTIVE'
      }}</m-text>
      <m-text variant="title">{{
        pt ? 'Seu ritmo, em perspectiva.' : 'Your rhythm, in perspective.'
      }}</m-text>
    </m-column>
    <m-segmented-control
      v-model="range"
      :options="options"
      :disabled="disabled"
      :label="pt ? 'Período de foco' : 'Focus period'"
    />
    <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
      <m-row align="end" gap="sm"
        ><m-text variant="display" tone="accent">{{ minutes }}</m-text
        ><m-text tone="accent">min</m-text></m-row
      >
      <m-text tone="muted">{{
        pt ? 'Tempo para as ideias que importam.' : 'Time for the ideas that matter.'
      }}</m-text>
      <m-row :height="140" align="end" gap="sm" :accessibilityHidden="true">
        <m-box
          v-for="(height, index) in bars"
          :key="index"
          :width="0"
          :grow="1"
          :height="height"
          radius="sm"
          :backgroundColor="index === 5 ? theme.colors.accent : theme.colors.surface"
        />
      </m-row>
      <m-text variant="caption" tone="muted">{{
        pt
          ? 'Valores ilustrativos, sem coleta de atividade.'
          : 'Illustrative values; no activity is collected.'
      }}</m-text>
    </m-card>
    <m-switch v-model="disabled" :label="pt ? 'Bloquear seleção' : 'Disable selection'" />
    <m-column gap="sm">
      <m-text variant="caption" tone="muted">{{
        pt ? 'Uma opção pode ficar indisponível.' : 'An option can be unavailable.'
      }}</m-text>
      <m-segmented-control
        :modelValue="'personal'"
        :options="[
          { value: 'personal', label: pt ? 'Pessoal' : 'Personal' },
          { value: 'team', label: pt ? 'Equipe' : 'Team', disabled: true },
        ]"
        :label="pt ? 'Espaço de trabalho' : 'Workspace'"
      />
    </m-column>
  </m-column>
</template>
