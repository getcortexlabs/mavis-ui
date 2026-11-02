<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref } from 'vue'

const { t } = useCatalogLocale()

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const alignments = ['stretch', 'start', 'center', 'end'] as const
const selected = ref(0)
</script>

<template>
  <m-column gap="lg">
    <m-column :align="alignments[selected]" gap="sm">
      <m-button variant="secondary">{{ t('Alpha') }}</m-button>
      <m-button variant="secondary">{{ t('Beta') }}</m-button>
      <m-button variant="secondary">{{ t('Gamma') }}</m-button>
    </m-column>
    <m-button variant="ghost" @click="selected = (selected + 1) % alignments.length"
      >{{ t('Align: ') }}{{ t(alignments[selected]) }}</m-button
    >
  </m-column>
</template>
