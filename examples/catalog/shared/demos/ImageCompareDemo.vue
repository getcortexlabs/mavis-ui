<script setup lang="ts">
import { computed, ref } from 'vue'
import { mountains, coast } from '../atlas/photos'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const amount = ref(50)
const vertical = ref(false)
</script>
<template>
  <MColumn gap="lg">
    <MColumn gap="xs"
      ><MText text="FIND YOUR ELSEWHERE" variant="overline" tone="primary" /><MText
        :text="t('Two ways to get away.', 'Dois caminhos para sair da rotina.')"
        variant="title" /><MText
        :text="
          t(
            'A mountain morning or a day by the coast?',
            'Uma manhã na montanha ou um dia à beira-mar?',
          )
        "
        tone="muted"
    /></MColumn>
    <MImageCompare
      v-model="amount"
      :before="mountains"
      :after="coast"
      :label="t('Choose your landscape', 'Escolha sua paisagem')"
      :beforeLabel="t('Mountains', 'Montanhas')"
      :afterLabel="t('Coast', 'Litoral')"
      :orientation="vertical ? 'vertical' : 'horizontal'"
    />
    <MRow gap="sm" wrap
      ><MButton
        :text="t('More mountains', 'Mais montanhas')"
        variant="secondary"
        @click="amount = 85" /><MButton
        :text="t('More coast', 'Mais litoral')"
        variant="secondary"
        @click="amount = 15" /><MButton
        :text="t('Change direction', 'Mudar direção')"
        variant="ghost"
        @click="vertical = !vertical"
    /></MRow>
    <MText id="compare-value" :text="String(amount)" variant="caption" tone="muted" />
  </MColumn>
</template>
