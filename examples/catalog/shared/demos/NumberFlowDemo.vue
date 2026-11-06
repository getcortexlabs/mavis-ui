<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const revenue = ref(12480.5)
const orders = ref(128)
const currency = ref('USD')
function grow() {
  revenue.value += 1376.25
  orders.value += 17
}
function refund() {
  revenue.value -= 248.75
  orders.value = Math.max(0, orders.value - 3)
}
</script>
<template>
  <MCard padding="xl" gap="lg">
    <MRow justify="between" align="center" wrap gap="sm"
      ><MText
        :text="t('STUDIO / LIVE', 'ESTÚDIO / AO VIVO')"
        variant="overline"
        tone="muted" /><MBadge :text="t('This month', 'Este mês')" tone="success"
    /></MRow>
    <MColumn gap="xs"
      ><MText
        :text="t('Small ideas. Real momentum.', 'Pequenas ideias. Grandes passos.')"
        variant="heading" /><MText
        :text="t('Your work, adding up.', 'Seu trabalho ganhando valor.')"
        tone="muted"
    /></MColumn>
    <MNumberFlow
      id="flow-revenue"
      :value="revenue"
      :label="t('Revenue', 'Receita')"
      :locale="pt ? 'pt-BR' : 'en-US'"
      :format="{ style: 'currency', currency }"
    />
    <MSeparator />
    <MRow gap="xl" align="center" wrap
      ><MColumn gap="xs"
        ><MText
          :text="t('Orders fulfilled', 'Pedidos entregues')"
          variant="caption"
          tone="muted" /><MNumberFlow
          :value="orders"
          variant="title"
          :label="t('Orders', 'Pedidos')" /></MColumn
      ><MColumn gap="xs"
        ><MText
          :text="t('Goal reached', 'Meta alcançada')"
          variant="caption"
          tone="muted" /><MNumberFlow
          :value="Math.min(1, revenue / 20000)"
          variant="title"
          :format="{ style: 'percent', maximumFractionDigits: 1 }" /></MColumn
    ></MRow>
    <MRow gap="sm" wrap
      ><MButton :text="t('New orders', 'Novos pedidos')" icon="plus" @click="grow" /><MButton
        :text="t('Refund', 'Reembolso')"
        variant="secondary"
        @click="refund" /><MButton
        :text="currency === 'USD' ? 'BRL' : 'USD'"
        variant="ghost"
        @click="currency = currency === 'USD' ? 'BRL' : 'USD'"
    /></MRow>
  </MCard>
</template>
