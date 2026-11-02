<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CivilDate } from '@getcortexlabs/mavis-core'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const date = ref<CivilDate | null>('2026-11-12')
</script>

<template>
  <m-column gap="lg">
    <m-text variant="heading">{{ pt ? 'Um dia para criar' : 'A day to create' }}</m-text>
    <m-text tone="muted">{{
      pt
        ? 'Escolha uma data no calendário ou escreva ano, mês e dia.'
        : 'Choose a calendar date or enter its year, month and day.'
    }}</m-text>
    <m-date-picker
      v-model="date"
      :label="pt ? 'Dia do encontro' : 'Workshop date'"
      :locale="pt ? 'pt-BR' : 'en-US'"
      min="2026-11-01"
      max="2026-12-31"
      initialMonth="2026-11"
      :unavailableDates="['2026-11-15']"
      :helperText="
        pt
          ? '15 de novembro está indisponível. Formato AAAA-MM-DD.'
          : 'November 15 is unavailable. Use YYYY-MM-DD.'
      "
    />
    <m-text :text="`${pt ? 'Data escolhida' : 'Selected date'}: ${date ?? '—'}`" />
    <m-date-picker
      modelValue="2026-11-12"
      readonly
      :label="pt ? 'Data confirmada' : 'Confirmed date'"
      :locale="pt ? 'pt-BR' : 'en-US'"
    />
  </m-column>
</template>
