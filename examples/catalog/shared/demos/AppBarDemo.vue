<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const visits = ref(0)
</script>

<template>
  <MColumn gap="md">
    <MAppBar
      :title="t('Collections', 'Coleções')"
      :subtitle="t('Keep what inspires you', 'Guarde o que inspira você')"
      back
      :backLabel="t('Back', 'Voltar')"
      :navigateBack="
        () => {
          visits++
        }
      "
    >
      <template #actions
        ><MButton
          icon="plus"
          variant="ghost"
          :accessibilityLabel="t('New collection', 'Nova coleção')"
          @click="visits++"
      /></template>
    </MAppBar>
    <MText id="app-bar-visits" :text="`${t('Actions', 'Ações')}: ${visits}`" tone="muted" />
  </MColumn>
</template>
