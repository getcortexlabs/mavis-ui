<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const animated = ref(true)

import { civilDate, addCivilDays } from '@getcortexlabs/mavis-core'
const start = civilDate('2026-09-01'),
  end = civilDate('2026-10-12'),
  selected = ref<ReturnType<typeof civilDate> | null>(null),
  week = ref(0)
const values = computed(() =>
  Array.from({ length: 42 }, (_, i) => ({
    date: addCivilDays(start, i),
    value: i % 13 === 0 ? null : (i * 7 + week.value * 3) % 11,
  })),
)
</script>
<template>
  <MColumn gap="lg">
    <MText text="THE FIELD GUIDE / 03" variant="overline" tone="primary" />
    <MText
      :text="t('Small days. A bigger picture.', 'Pequenos dias. Uma história maior.')"
      variant="title"
    />
    <MText
      :text="
        t(
          'Six weeks of making, exploring and showing up.',
          'Seis semanas de criação, descobertas e presença.',
        )
      "
      tone="muted"
    />
    <MCard padding="lg"
      ><MHeatmap
        id="studio-heatmap"
        v-model="selected"
        :start="start"
        :end="end"
        :values="values"
        :animated="animated"
        :label="t('The creative practice', 'A prática criativa')"
        :dataLabel="t('View data', 'Ver dados')"
        :missingLabel="t('No data', 'Sem dados')"
        :lessLabel="t('Less', 'Menos')"
        :moreLabel="t('More', 'Mais')"
    /></MCard>
    <MRow gap="sm" wrap
      ><MButton
        :text="t('Another chapter', 'Outro capítulo')"
        variant="secondary"
        @click="week++" /><MText
        id="heatmap-value"
        :text="selected ?? t('Choose a day', 'Escolha um dia')"
    /></MRow>

    <MSwitch v-model="animated" :label="t('Animate changes', 'Animar mudanças')" />
  </MColumn>
</template>
