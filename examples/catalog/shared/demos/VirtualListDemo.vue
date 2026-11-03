<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { VirtualListHandle } from '@getcortexlabs/mavis-core'
const list = ref<VirtualListHandle>()
const items = ref(
  Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    title: `Collection ${i + 1}`,
    saved: false,
  })),
)
function reverse() {
  items.value = [...items.value].reverse()
}
</script>

<template>
  <MColumn gap="md">
    <MRow gap="sm" wrap
      ><MButton
        :text="t('Last item', 'Último item')"
        @click="list?.scrollToIndex(items.length - 1)" /><MButton
        :text="t('Reverse', 'Inverter')"
        variant="secondary"
        @click="reverse"
    /></MRow>
    <MVirtualList
      ref="list"
      :items="items"
      itemKey="id"
      :rowHeight="72"
      :height="360"
      :label="t('A thousand collections', 'Mil coleções')"
    >
      <template #default="{ item }"
        ><MRow :height="72" paddingX="sm" gap="md"
          ><MText :text="`${t('Collection', 'Coleção')} ${item.id}`" :grow="1" /><MButton
            :text="item.saved ? t('Saved', 'Salvo') : t('Save', 'Salvar')"
            :icon="item.saved ? 'heart' : 'plus'"
            :accessibilityLabel="`${t('Save', 'Salvar')} ${item.id}`"
            variant="ghost"
            @click="item.saved = !item.saved" /></MRow
      ></template>
    </MVirtualList>
    <MText
      :text="
        t(
          'Saved state belongs to each item and survives cell reuse.',
          'O estado pertence a cada item e acompanha a reciclagem das células.',
        )
      "
      variant="caption"
      tone="muted"
    />
  </MColumn>
</template>
