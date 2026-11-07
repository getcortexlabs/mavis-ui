<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const animated = ref(true)

import { civilDate, type SchedulerEvent } from '@getcortexlabs/mavis-core'
const date = ref(civilDate('2026-11-02')),
  single = ref(true),
  last = ref('')
const events = ref<SchedulerEvent[]>([
  {
    id: 'walk',
    title: 'Morning field walk',
    start: Date.parse('2026-11-02T14:00:00Z'),
    end: Date.parse('2026-11-02T16:00:00Z'),
  },
  {
    id: 'review',
    title: 'Portfolio review',
    start: Date.parse('2026-11-02T15:00:00Z'),
    end: Date.parse('2026-11-02T16:30:00Z'),
  },
  {
    id: 'note',
    title: 'A small pause',
    start: Date.parse('2026-11-02T18:00:00Z'),
    end: Date.parse('2026-11-02T18:15:00Z'),
  },
  {
    id: 'print',
    title: 'Print workshop',
    start: Date.parse('2026-11-03T15:00:00Z'),
    end: Date.parse('2026-11-03T17:00:00Z'),
  },
])
</script>
<template>
  <MColumn gap="lg">
    <MText text="THE FIELD GUIDE / 05" variant="overline" tone="primary" />
    <MText
      :text="t('Make time for the good work.', 'Reserve tempo para o que importa.')"
      variant="title"
    />
    <MSwitch v-model="single" :label="t('One day at a time', 'Um dia de cada vez')" />
    <MScheduler
      id="studio-scheduler"
      v-model="events"
      :date="date"
      @update:date="date = civilDate($event)"
      timeZone="America/New_York"
      :days="single ? 1 : 7"
      :startHour="8"
      :endHour="16"
      :dayWidth="280"
      :animated="animated"
      :label="t('A week at the studio', 'Uma semana no estúdio')"
      :previousLabel="t('Previous', 'Anterior')"
      :nextLabel="t('Next', 'Próximo')"
      :moveLabel="t('Move event', 'Mover evento')"
      :resizeLabel="t('Resize event', 'Redimensionar evento')"
      :earlierLabel="t('Earlier', 'Mais cedo')"
      :laterLabel="t('Later', 'Mais tarde')"
      :previousDayLabel="t('Previous day', 'Dia anterior')"
      :nextDayLabel="t('Next day', 'Próximo dia')"
      :shorterLabel="t('Shorter', 'Mais curto')"
      :longerLabel="t('Longer', 'Mais longo')"
      :emptyLabel="t('A day with room to breathe', 'Um dia com espaço para respirar')"
      @change="last = $event.id + ':' + new Date($event.start).toISOString()"
    />
    <MText id="scheduler-result" :text="last" variant="caption" tone="muted" />
  </MColumn>
  <MColumn gap="lg">
    <MSwitch v-model="animated" :label="t('Animate changes', 'Animar mudanças')" />
  </MColumn>
</template>
