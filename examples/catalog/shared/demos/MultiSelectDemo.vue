<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const selected = ref<ChoiceValue[]>(['frame'])
const options = computed(() => [
  { value: 'frame', label: pt.value ? 'Moldura' : 'Frame' },
  { value: 'gift', label: pt.value ? 'Embalagem de presente' : 'Gift wrapping' },
  { value: 'note', label: pt.value ? 'Cartão escrito à mão' : 'Handwritten note' },
  { value: 'signed', label: pt.value ? 'Edição assinada' : 'Signed edition', disabled: true },
])
</script>
<template>
  <m-column gap="md">
    <m-multi-select
      v-model="selected"
      :options="options"
      :maxSelected="2"
      :label="pt ? 'Extras' : 'Extras'"
      :searchLabel="pt ? 'Buscar extras' : 'Search extras'"
      :closeLabel="pt ? 'Concluir' : 'Done'"
      :removeLabel="pt ? 'Remover' : 'Remove'"
      :emptyLabel="pt ? 'Nenhuma opção encontrada' : 'No matching options'"
      :placeholder="pt ? 'Escolher extras' : 'Choose extras'"
    />
    <m-text tone="muted" variant="caption">{{
      pt
        ? 'Escolha até dois detalhes para deixar sua edição especial.'
        : 'Choose up to two details to make your edition special.'
    }}</m-text>
  </m-column>
</template>
