<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const alternate = ref(false),
  gaps = ref(false),
  animated = ref(true)
const points = computed(() =>
  (alternate.value ? [14, 26, 18, 40, 36, 58, 72] : [12, 8, 24, 19, 38, 29, 48]).map(
    (value, i) => ({
      id: String(i),
      label: t('Day', 'Dia') + ' ' + (i + 1),
      value: gaps.value && i === 3 ? null : value,
    }),
  ),
)
const negative = computed(() =>
  points.value.map((p) => ({ ...p, value: p.value === null ? null : p.value - 32 })),
)
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FORMA STUDIO / SMALL SIGNALS" variant="overline" tone="primary" /><MText
      :text="t('The direction matters.', 'A direção importa.')"
      variant="title" /><MStack
      direction="column"
      :responsive="{ at: 680, direction: 'row' }"
      gap="md"
      ><MCard :grow="1" padding="lg" gap="md"
        ><MText :text="t('New conversations', 'Novas conversas')" variant="heading" /><MNumberFlow
          :value="points[6]?.value ?? 0"
          variant="display" /><MSparkline
          id="studio-sparkline"
          :label="t('Conversations', 'Conversas')"
          :points="points"
          :animated="animated"
          :dataLabel="t('View data', 'Ver dados')" /></MCard
      ><MCard :grow="1" padding="lg" gap="md"
        ><MText :text="t('Above and below', 'Altos e baixos')" variant="heading" /><MText
          text="± 32"
          variant="display" /><MSparkline
          :label="t('Daily variation', 'Variação diária')"
          :points="negative"
          color="#51847B"
          :animated="animated"
          :dataLabel="t('View data', 'Ver dados')" /></MCard></MStack
    ><MRow gap="sm" wrap
      ><MButton
        :text="t('New readings', 'Novas leituras')"
        @click="alternate = !alternate" /><MSwitch
        v-model="gaps"
        :label="t('Missing reading', 'Leitura ausente')" /><MSwitch
        v-model="animated"
        :label="t('Animate lines', 'Animar linhas')" /></MRow
  ></MColumn>
</template>
