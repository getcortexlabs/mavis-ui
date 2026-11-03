<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const open = ref(false)
const query = ref('')
</script>

<template>
  <MColumn gap="md">
    <MText
      as="h2"
      variant="heading"
      :text="t('A little more context', 'Um pouco mais de contexto')"
    />
    <MPopover
      v-model:open="open"
      :label="t('Refine the collection', 'Refinar a coleção')"
      :triggerLabel="t('Filters', 'Filtros')"
      icon="sliders-horizontal"
    >
      <template #default="{ close }">
        <MColumn gap="md"
          ><MInput v-model="query" :label="t('Search', 'Buscar')" /><MButton
            :text="t('Apply filters', 'Aplicar filtros')"
            @click="close"
        /></MColumn>
      </template>
    </MPopover>
    <MText
      id="popover-query"
      :text="query || t('Your collection, your way.', 'Sua coleção, do seu jeito.')"
      tone="muted"
    />
  </MColumn>
</template>
