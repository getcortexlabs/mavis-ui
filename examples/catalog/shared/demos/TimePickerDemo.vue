<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const time = ref<string | null>('09:30')
</script>

<template>
  <MColumn gap="md">
    <MTimePicker
      v-model="time"
      :label="t('Meeting time', 'Horário do encontro')"
      :locale="pt ? 'pt-BR' : 'en-US'"
      min="08:00"
      max="18:00"
      :minuteStep="15"
      name="meeting-time"
      :helperText="t('08:00–18:00, every 15 minutes.', '08:00–18:00, a cada 15 minutos.')"
      :chooseLabel="t('Choose time', 'Escolher horário')"
      :confirmLabel="t('Apply', 'Aplicar')"
      :cancelLabel="t('Cancel', 'Cancelar')"
      :clearLabel="t('Clear time', 'Limpar horário')"
      :hourLabel="t('Hour', 'Hora')"
      :minuteLabel="t('Minute', 'Minuto')"
      :periodLabel="t('Period', 'Período')"
      :invalidLabel="
        t(
          'Choose a time between 08:00 and 18:00 in 15-minute intervals.',
          'Escolha entre 08:00 e 18:00, em intervalos de 15 minutos.',
        )
      "
    />
    <MText id="time-value" :text="time ?? '—'" tone="muted" />
  </MColumn>
</template>
