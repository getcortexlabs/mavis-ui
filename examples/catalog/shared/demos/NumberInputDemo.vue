<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const value = ref<number | null>(2)
const draft = ref('2')
const disabled = ref(false)
</script>
<template>
  <m-column gap="md">
    <m-number-input
      id="number-demo"
      v-model="value"
      v-model:draft="draft"
      :label="pt ? 'Quantidade' : 'Quantity'"
      :min="0"
      :max="12"
      :step="0.5"
      :locale="pt ? 'pt-BR' : 'en-US'"
      :incrementLabel="pt ? 'Aumentar' : 'Increase'"
      :decrementLabel="pt ? 'Diminuir' : 'Decrease'"
      :disabled="disabled"
    />
    <m-text variant="caption" tone="muted">{{
      pt
        ? `Valor: ${value ?? '—'} · Rascunho: ${draft}`
        : `Value: ${value ?? '—'} · Draft: ${draft}`
    }}</m-text>
    <m-switch v-model="disabled" :label="pt ? 'Desabilitar' : 'Disable'" />
  </m-column>
</template>
