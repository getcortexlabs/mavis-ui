<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { RangeValue } from '@getcortexlabs/mavis-core'
const range = ref<RangeValue>([200, 650])
const disabled = ref(false)
const format = (value: number) => `${pt.value ? 'R$' : '$'} ${value}`
</script>

<template>
  <MCard gap="lg" padding="lg">
    <MRow gap="md"
      ><MIcon name="sliders-horizontal" tone="primary" :size="28" /><MText
        variant="heading"
        :text="t('Find your sweet spot', 'Encontre seu intervalo')"
    /></MRow>
    <MText
      :text="t('A weekend away, within reach.', 'Uma viagem de fim de semana que cabe no bolso.')"
      tone="muted"
    />
    <MRangeSlider
      v-model="range"
      :min="0"
      :max="1000"
      :step="25"
      :label="t('Nightly budget', 'Orçamento por noite')"
      :formatValue="format"
      :disabled="disabled"
    />
    <MSwitch v-model="disabled" :label="t('Lock budget', 'Fixar orçamento')" />
    <MText id="range-value" :text="range.join(' – ')" variant="caption" tone="muted" />
  </MCard>
</template>
