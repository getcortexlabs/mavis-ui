<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { CivilDate, DateRange } from '@getcortexlabs/mavis-core'
const dates = ref<CivilDate | DateRange | null>({ start: '2026-11-10', end: '2026-11-13' })
const selected = computed(() =>
  typeof dates.value === 'object' && dates.value
    ? `${dates.value.start ?? '…'} / ${dates.value.end ?? '…'}`
    : '',
)
</script>

<template>
  <MColumn gap="md">
    <MText
      variant="overline"
      :text="t('MAKE TIME FOR SOMETHING GOOD', 'RESERVE TEMPO PARA ALGO BOM')"
      tone="primary"
    />
    <MCalendar
      v-model="dates"
      mode="range"
      :label="t('Your next escape', 'Sua próxima escapada')"
      initialMonth="2026-11"
      min="2026-11-01"
      max="2027-02-28"
      :unavailableDates="['2026-11-18']"
      :locale="pt ? 'pt-BR' : 'en-US'"
    >
      <template #footer
        ><MText
          :text="
            t(
              'Choose a start and end date. November 18 is unavailable.',
              'Escolha início e fim. O dia 18 de novembro está indisponível.',
            )
          "
          variant="caption"
          tone="muted"
      /></template>
    </MCalendar>
    <MText id="calendar-value" :text="selected" variant="caption" />
  </MColumn>
</template>
