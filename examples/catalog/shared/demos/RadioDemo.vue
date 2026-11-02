<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })
const language = computed(() => props.lang ?? locale.value)
const { theme } = useMavisTheme()
const selected = ref<ChoiceValue | null>(null)
const changes = ref(0)
const options = computed<ChoiceOption[]>(() =>
  (props.lang ?? locale.value) === 'pt'
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
        t(language === 'pt' ? 'MENOS RUÍDO' : 'LESS NOISE')
      }}</m-text>
      <m-text variant="heading">{{
        t(language === 'pt' ? 'No seu tempo.' : 'At your own pace.')
      }}</m-text>
      <m-text variant="caption" tone="muted">{{
        t(
          language === 'pt'
            ? 'Escolha como as novidades chegam até você.'
            : 'Choose how new ideas reach you.',
        )
      }}</m-text>
    </m-column>
    <m-radio-group
      :modelValue="selected"
      :options="options"
      :label="t(language === 'pt' ? 'Ritmo de leitura' : 'Reading rhythm')"
      @update:modelValue="choose"
    />
    <m-column padding="md" gap="xs" radius="md" :backgroundColor="theme.colors.accentSoft">
      <m-text variant="caption" tone="accent">{{
        t(language === 'pt' ? 'SUA ESCOLHA' : 'YOUR CHOICE')
      }}</m-text>
      <m-text>{{
        t(current ?? (language === 'pt' ? 'Ainda sem escolha' : 'Nothing selected yet'))
      }}</m-text>
    </m-column>
    <m-radio-group
      :modelValue="'calm'"
      :options="options.slice(0, 2)"
      disabled
      :label="t(language === 'pt' ? 'Preferência da equipe' : 'Team preference')"
    />
    <m-row justify="between" wrap gap="sm">
      <m-text variant="caption" tone="muted">{{
        t(
          language === 'pt'
            ? `${changes} ${changes === 1 ? 'alteração' : 'alterações'}`
            : `${changes} ${changes === 1 ? 'change' : 'changes'}`,
        )
      }}</m-text>
      <m-button size="sm" variant="ghost" @click="selected = null">{{
        t(language === 'pt' ? 'Limpar escolha' : 'Clear selection')
      }}</m-button>
    </m-row>
  </m-column>
</template>
