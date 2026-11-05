<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
import type { ChartSelection, ChartSeries, ChoiceValue } from '@getcortexlabs/mavis-core'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const selection = ref<ChartSelection | null>(null)
const hidden = ref<ChoiceValue[]>([])
const mode = ref<ChoiceValue>('line')
const nextWeek = ref(false)
const categories = computed(() =>
  (pt.value
    ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  ).map((label, index) => ({ key: index, label })),
)
const series = computed<ChartSeries[]>(() => [
  {
    key: 'visits',
    label: t('Visits', 'Visitas'),
    values: nextWeek.value ? [32, 44, 38, 64, 58, 72, 89] : [18, 32, 25, 48, 39, 68, 57],
  },
  {
    key: 'saves',
    label: t('Saves', 'Salvos'),
    values: nextWeek.value ? [16, 28, 20, 42, 30, 54, 62] : [8, 18, null, 27, 23, 42, 38],
  },
])
</script>

<template>
  <MCard padding="lg" gap="lg">
    <MRow justify="between" gap="sm" wrap
      ><MText
        :text="t('A good week, in perspective.', 'Uma boa semana, em perspectiva.')"
        variant="title"
        :shrink="1" /><MBadge text="+18.6%" tone="success"
    /></MRow>
    <MSegmentedControl
      v-model="mode"
      :options="[
        { value: 'line', label: t('Lines', 'Linhas') },
        { value: 'bar', label: t('Bars', 'Barras') },
      ]"
      :label="t('Chart style', 'Estilo do gráfico')"
    />
    <MChart
      v-model="selection"
      v-model:hiddenSeries="hidden"
      :type="mode === 'bar' ? 'bar' : 'line'"
      :categories="categories"
      :series="series"
      :height="200"
      :label="t('Your work is finding its people.', 'Seu trabalho encontra seu público.')"
      :description="
        t(
          'Seven days of curiosity. Select a day to look closer.',
          'Sete dias de curiosidade. Escolha um dia para ver de perto.',
        )
      "
      :categoryLabel="t('Day', 'Dia')"
      :seriesLabel="t('Metric', 'Métrica')"
      :showDataLabel="t('Show data', 'Mostrar dados')"
      :hideDataLabel="t('Hide data', 'Ocultar dados')"
      :clearLabel="t('Clear selection', 'Limpar seleção')"
      :missingLabel="t('No value', 'Sem valor')"
      :emptyLabel="t('No chart data', 'Sem dados no gráfico')"
    />
    <MButton
      :text="t('Another week', 'Outra semana')"
      icon="arrow-right"
      variant="ghost"
      @click="nextWeek = !nextWeek"
    />
    <MText
      id="chart-value"
      :text="selection ? `${selection.category}/${selection.series}` : '—'"
      variant="caption"
      tone="muted"
    />
  </MCard>
</template>
