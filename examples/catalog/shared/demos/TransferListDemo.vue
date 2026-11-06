<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const selected = ref<ChoiceValue[]>(['camera']),
  animated = ref(true)
const options = computed(() => [
  { value: 'camera', label: t('Camera', 'Câmera') },
  { value: 'notebook', label: t('Field notebook', 'Caderno de campo') },
  { value: 'compass', label: t('Compass', 'Bússola') },
  { value: 'water', label: t('Water bottle', 'Garrafa de água') },
  { value: 'radio', label: t('Radio · unavailable', 'Rádio · indisponível'), disabled: true },
])
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FIELD NOTES / PACK LIGHT" variant="overline" tone="primary" /><MText
      :text="t('Take only what moves you.', 'Leve só o que te move.')"
      variant="title" /><MTransferList
      v-model="selected"
      :options="options"
      :animated="animated"
      :label="t('Your expedition kit', 'Seu kit de expedição')"
      :availableLabel="t('On the shelf', 'Na prateleira')"
      :selectedLabel="t('In your bag', 'Na mochila')"
      :searchLabel="t('Filter', 'Filtrar')"
      :addLabel="t('Pack selected', 'Guardar selecionados')"
      :removeLabel="t('Leave selected', 'Retirar selecionados')"
      :emptyLabel="t('No matches', 'Nenhum resultado')" /><MText
      id="transfer-values"
      :text="selected.join(', ')"
      variant="caption" /><MSwitch
      v-model="animated"
      :label="t('Animate changes', 'Animar mudanças')"
  /></MColumn>
</template>
