<script setup lang="ts">
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
</script>

<template>
  <MCard padding="lg" gap="lg">
    <MRow justify="between" gap="md"
      ><MText
        :text="t('A little context.', 'Um pouco de contexto.')"
        variant="heading"
        :shrink="1" /><MTooltip
        :triggerLabel="t('About this metric', 'Sobre esta métrica')"
        :text="
          t(
            'Active members are people who contributed during the last seven days.',
            'Membros ativos são pessoas que contribuíram nos últimos sete dias.',
          )
        "
    /></MRow>
    <MText text="128" variant="display" />
    <MRow gap="sm" wrap
      ><MBadge text="+24%" tone="success" /><MText
        :text="t('more ideas, together', 'mais ideias, em companhia')"
        tone="muted"
        :shrink="1"
    /></MRow>
    <MSeparator />
    <MText
      :text="
        t(
          'Focus, hover or tap the information button.',
          'Foque, passe o cursor ou toque no botão de informação.',
        )
      "
      variant="caption"
      tone="muted"
    />
  </MCard>
</template>
