<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const { theme } = useMavisTheme()
const selected = ref<ChoiceValue | null>(null)
const changes = ref(0)
const options = computed<ChoiceOption[]>(() =>
  props.lang === 'pt'
    ? [
        { value: 'calm', label: 'Sem pressa', helperText: 'Um resumo leve, no fim da semana.' },
        { value: 'daily', label: 'Um pouco por dia', helperText: 'Uma seleção nova a cada manhã.' },
        {
          value: 'live',
          label: 'Em tempo real',
          helperText: 'Disponível em breve.',
          disabled: true,
        },
      ]
    : [
        {
          value: 'calm',
          label: 'Take it slow',
          helperText: 'A light digest at the end of the week.',
        },
        {
          value: 'daily',
          label: 'A little every day',
          helperText: 'A fresh selection each morning.',
        },
        { value: 'live', label: 'As it happens', helperText: 'Coming soon.', disabled: true },
      ],
)
const current = computed(
  () => options.value.find((option) => option.value === selected.value)?.label,
)
function choose(value: ChoiceValue) {
  selected.value = value
  changes.value++
}
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="sm" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-text variant="overline" tone="primary">{{
        lang === 'pt' ? 'MENOS RUÍDO' : 'LESS NOISE'
      }}</m-text>
      <m-text variant="heading">{{ lang === 'pt' ? 'No seu tempo.' : 'At your own pace.' }}</m-text>
      <m-text variant="caption" tone="muted">{{
        lang === 'pt'
          ? 'Escolha como as novidades chegam até você.'
          : 'Choose how new ideas reach you.'
      }}</m-text>
    </m-column>
    <m-radio-group
      :modelValue="selected"
      :options="options"
      :label="lang === 'pt' ? 'Ritmo de leitura' : 'Reading rhythm'"
      @update:modelValue="choose"
    />
    <m-column padding="md" gap="xs" radius="md" :backgroundColor="theme.colors.accentSoft">
      <m-text variant="caption" tone="accent">{{
        lang === 'pt' ? 'SUA ESCOLHA' : 'YOUR CHOICE'
      }}</m-text>
      <m-text>{{
        current ?? (lang === 'pt' ? 'Ainda sem escolha' : 'Nothing selected yet')
      }}</m-text>
    </m-column>
    <m-radio-group
      :modelValue="'calm'"
      :options="options.slice(0, 2)"
      disabled
      :label="lang === 'pt' ? 'Preferência da equipe' : 'Team preference'"
    />
    <m-row justify="between" wrap gap="sm">
      <m-text variant="caption" tone="muted">{{
        lang === 'pt'
          ? `${changes} ${changes === 1 ? 'alteração' : 'alterações'}`
          : `${changes} ${changes === 1 ? 'change' : 'changes'}`
      }}</m-text>
      <m-button size="sm" variant="ghost" @click="selected = null">{{
        lang === 'pt' ? 'Limpar escolha' : 'Clear selection'
      }}</m-button>
    </m-row>
  </m-column>
</template>
