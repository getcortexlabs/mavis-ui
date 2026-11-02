<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })
const { theme } = useMavisTheme()
const selected = ref<ChoiceValue | null>(null)
const changes = ref(0)
const requiredInterest = ref<ChoiceValue | null>(null)

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const options = computed<ChoiceOption[]>(() =>
  pt.value
    ? [
        { value: 'design', label: 'Design', helperText: 'Ideias que ganham forma.' },
        { value: 'photography', label: 'Fotografia', helperText: 'Histórias contadas pela luz.' },
        {
          value: 'architecture',
          label: 'Arquitetura e espaços para viver',
          helperText: 'Um olhar novo sobre os lugares de todo dia.',
        },
        { value: 'film', label: 'Cinema', helperText: 'Disponível em breve.', disabled: true },
      ]
    : [
        { value: 'design', label: 'Design', helperText: 'Ideas taking shape.' },
        { value: 'photography', label: 'Photography', helperText: 'Stories told through light.' },
        {
          value: 'architecture',
          label: 'Architecture and spaces to live in',
          helperText: 'A new perspective on everyday places.',
        },
        { value: 'film', label: 'Film', helperText: 'Coming soon.', disabled: true },
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
    <m-column padding="lg" gap="sm" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-row justify="between" gap="md">
        <m-text variant="overline" tone="accent">{{
          t(pt ? 'UM NOVO OLHAR' : 'A FRESH PERSPECTIVE')
        }}</m-text>
        <m-icon name="compass" size="lg" tone="accent" />
      </m-row>
      <m-text variant="heading">{{ t(pt ? 'O que move você?' : 'What moves you?') }}</m-text>
      <m-text variant="caption" tone="muted">{{
        t(pt ? 'Um interesse abre novas possibilidades.' : 'One interest opens new possibilities.')
      }}</m-text>
    </m-column>
    <m-select
      :modelValue="selected"
      :options="options"
      :label="t(pt ? 'Seu universo' : 'Your world')"
      :placeholder="t(pt ? 'Escolha um interesse' : 'Choose an interest')"
      :helperText="
        t(
          pt
            ? 'Comece pelo que desperta a sua curiosidade.'
            : 'Start with what sparks your curiosity.',
        )
      "
      :closeLabel="t(pt ? 'Fechar' : 'Close')"
      @update:modelValue="choose"
    />
    <m-column padding="md" gap="xs" radius="md" :backgroundColor="theme.colors.primarySoft">
      <m-text variant="caption" tone="primary">{{ t(pt ? 'SUA ESCOLHA' : 'YOUR CHOICE') }}</m-text>
      <m-text>{{
        t(current ?? (pt ? 'Um mundo para descobrir.' : 'A world to discover.'))
      }}</m-text>
    </m-column>
    <m-select
      :modelValue="'design'"
      :options="options"
      disabled
      :label="t(pt ? 'Seleção da equipe' : 'Team selection')"
    />
    <m-select
      v-model="requiredInterest"
      :options="options"
      :label="t(pt ? 'Interesse obrigatório' : 'Required interest')"
      :placeholder="t(pt ? 'Escolha um interesse' : 'Choose an interest')"
      :error="
        t(
          requiredInterest === null
            ? pt
              ? 'Escolha um interesse para continuar.'
              : 'Choose an interest to continue.'
            : '',
        )
      "
      :closeLabel="t(pt ? 'Fechar' : 'Close')"
    />
    <m-row justify="between" wrap gap="sm">
      <m-text variant="caption" tone="muted">{{
        t(
          pt
            ? `${changes} ${changes === 1 ? 'alteração' : 'alterações'}`
            : `${changes} ${changes === 1 ? 'change' : 'changes'}`,
        )
      }}</m-text>
      <m-button size="sm" variant="ghost" @click="selected = null">{{
        t(pt ? 'Limpar escolha' : 'Clear selection')
      }}</m-button>
    </m-row>
  </m-column>
</template>
