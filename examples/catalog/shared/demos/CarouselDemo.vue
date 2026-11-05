<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const current = ref<ChoiceValue>('explore')
const slides = computed(() => [
  {
    id: 'explore',
    icon: 'compass' as const,
    eyebrow: t('01 / EXPLORE', '01 / EXPLORE'),
    title: t('Take the scenic route.', 'Escolha o caminho mais bonito.'),
    detail: t(
      'Small detours. Unexpected discoveries.',
      'Pequenos desvios. Descobertas inesperadas.',
    ),
  },
  {
    id: 'collect',
    icon: 'layers' as const,
    eyebrow: t('02 / COLLECT', '02 / GUARDE'),
    title: t('Keep what moves you.', 'Guarde o que te inspira.'),
    detail: t(
      'Your favorite places, together at last.',
      'Seus lugares favoritos, juntos por aqui.',
    ),
  },
  {
    id: 'share',
    icon: 'sparkles' as const,
    eyebrow: t('03 / SHARE', '03 / COMPARTILHE'),
    title: t('Good things travel.', 'Coisas boas vão mais longe.'),
    detail: t('Make room for someone new.', 'Abra espaço para novas companhias.'),
  },
])
</script>

<template>
  <MCarousel
    v-model="current"
    :items="slides"
    :label="t('A little inspiration', 'Um pouco de inspiração')"
  >
    <template #default="{ item }"
      ><MCard padding="xl" gap="lg" :height="340">
        <MRow justify="between"
          ><MText :text="item.eyebrow" variant="overline" tone="primary" /><MIcon
            :name="item.icon"
            :size="32"
            tone="primary"
        /></MRow>
        <MColumn :grow="1" justify="center" gap="md"
          ><MText :text="item.title" variant="title" /><MText :text="item.detail" tone="muted"
        /></MColumn>
        <MRow gap="sm"
          ><MBadge :text="t('Curated for you', 'Feito para você')" tone="primary" /><MText
            text="✦"
            tone="primary"
        /></MRow> </MCard
    ></template>
  </MCarousel>
  <MText id="carousel-value" :text="String(current)" variant="caption" tone="muted" />
</template>
