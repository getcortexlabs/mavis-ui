<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { CivilDate } from '@getcortexlabs/mavis-core'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const date = ref<CivilDate | null>('2026-11-12')
</script>

<template>
  <m-column gap="lg">
    <m-text variant="heading">{{ t(pt ? 'Um dia para criar' : 'A day to create') }}</m-text>
    <m-text tone="muted">{{
      t(
        pt
          ? 'Escolha uma data no calendário ou digite dia, mês e ano.'
          : 'Choose a calendar date or enter its month, day and year.',
      )
    }}</m-text>
    <m-date-picker
      v-model="date"
      :label="t(pt ? 'Dia do encontro' : 'Workshop date')"
      :locale="pt ? 'pt-BR' : 'en-US'"
      dateFormat="locale"
      min="2026-11-01"
      max="2026-12-31"
      initialMonth="2026-11"
      :unavailableDates="['2026-11-15']"
      :helperText="
        t(
          pt
            ? '15 de novembro está indisponível. Formato DD/MM/AAAA.'
            : 'November 15 is unavailable. Use MM/DD/YYYY.',
        )
      "
    />
    <m-text :text="t(`${pt ? 'Data escolhida' : 'Selected date'}: ${date ?? '—'}`)" />
    <m-date-picker
      modelValue="2026-11-12"
      readonly
      :label="t(pt ? 'Data confirmada' : 'Confirmed date')"
      :locale="pt ? 'pt-BR' : 'en-US'"
      dateFormat="locale"
    />
  </m-column>
</template>
