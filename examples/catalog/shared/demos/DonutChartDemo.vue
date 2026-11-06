<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const selected = ref<string | null>(null),
  alternate = ref(false),
  animated = ref(true),
  empty = ref(false)
const segments = computed(() => [
  {
    id: 'design',
    label: t('Design', 'Design'),
    value: empty.value ? 0 : alternate.value ? 36 : 54,
    color: '#9C5270',
  },
  {
    id: 'research',
    label: t('Research', 'Pesquisa'),
    value: empty.value ? 0 : alternate.value ? 42 : 28,
    color: '#51847B',
  },
  {
    id: 'strategy',
    label: t('Strategy', 'Estratégia'),
    value: empty.value ? 0 : alternate.value ? 22 : 18,
    color: '#BF733E',
  },
])
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FORMA STUDIO / TIME WELL SPENT" variant="overline" tone="primary" /><MCard
      padding="lg"
      ><MStack
        direction="column"
        :responsive="{ at: 720, direction: 'row' }"
        gap="lg"
        align="center"
        ><MColumn :grow="1" gap="md"
          ><MText
            :text="t('A week, in balance.', 'Uma semana, em equilíbrio.')"
            variant="title" /><MText
            :text="
              t(
                'Every hour has a purpose. Select a discipline to look closer.',
                'Cada hora tem um propósito. Escolha uma disciplina para olhar de perto.',
              )
            "
            tone="muted" /><MButton
            :text="t('Another week', 'Outra semana')"
            @click="alternate = !alternate" /></MColumn
        ><MDonutChart
          id="studio-donut"
          v-model="selected"
          :segments="segments"
          :label="t('Hours by discipline', 'Horas por disciplina')"
          :totalLabel="t('Hours', 'Horas')"
          :emptyLabel="t('A fresh start', 'Um novo começo')"
          :animated="animated"
          animateNumber /></MStack></MCard
    ><MRow gap="md" wrap
      ><MSwitch v-model="animated" :label="t('Animate arcs', 'Animar arcos')" /><MSwitch
        v-model="empty"
        :label="t('Empty week', 'Semana vazia')" /></MRow
    ><MText id="donut-selection" :text="selected ?? 'none'" variant="caption"
  /></MColumn>
</template>
