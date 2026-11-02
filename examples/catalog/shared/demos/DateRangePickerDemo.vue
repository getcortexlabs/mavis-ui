<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DateRange } from '@getcortexlabs/mavis-core'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const range = ref<DateRange>({ start: '2026-11-12', end: '2026-11-14' })
</script>

<template>
  <m-column gap="lg">
    <m-text variant="heading">{{ pt ? 'Tempo para explorar' : 'Time to explore' }}</m-text>
    <m-date-range-picker
      v-model="range"
      :label="pt ? 'Período da viagem' : 'Travel dates'"
      :locale="pt ? 'pt-BR' : 'en-US'"
      min="2026-11-01"
      max="2026-12-31"
      initialMonth="2026-11"
      :helperText="
        pt
          ? 'As duas datas fazem parte do intervalo. Um único dia também vale.'
          : 'Both endpoints are included. A single day is also a valid range.'
      "
    />
    <m-text :text="`${range.start ?? '—'} → ${range.end ?? '—'}`" />
    <m-text variant="caption" tone="muted">{{
      pt
        ? 'Datas civis: o app decide como associar um horário ou fuso.'
        : 'Civil dates: your app decides how to associate a time or time zone.'
    }}</m-text>
  </m-column>
</template>
