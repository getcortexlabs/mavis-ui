<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { ChoiceValue, MenuItem } from '@getcortexlabs/mavis-core'
const open = ref(false)
const selected = ref<ChoiceValue | null>(null)
const items = computed<MenuItem[]>(() => [
  { type: 'group', key: 'collection', label: t('Collection', 'Coleção') },
  { value: 'edit', label: t('Edit collection', 'Editar coleção'), icon: 'pencil' },
  { value: 'duplicate', label: t('Duplicate', 'Duplicar'), icon: 'copy' },
  { value: 'share', label: t('Share', 'Compartilhar'), icon: 'share', disabled: true },
  { type: 'separator', key: 'danger' },
  { value: 'remove', label: t('Remove', 'Remover'), icon: 'trash', destructive: true },
])
</script>

<template>
  <MColumn gap="md">
    <MMenu
      v-model:open="open"
      :label="t('Collection actions', 'Ações da coleção')"
      :triggerLabel="t('Actions', 'Ações')"
      icon="ellipsis"
      :items="items"
      @select="(value) => (selected = value)"
    />
    <MText
      id="menu-selection"
      :text="String(selected ?? t('Choose an action.', 'Escolha uma ação.'))"
      tone="muted"
    />
  </MColumn>
</template>
