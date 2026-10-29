<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const alignments = ['stretch', 'start', 'center', 'end'] as const
const selected = ref(0)
</script>

<template>
  <m-column gap="lg">
    <m-column :align="alignments[selected]" gap="sm">
      <m-button variant="secondary">Alpha</m-button>
      <m-button variant="secondary">Beta</m-button>
      <m-button variant="secondary">Gamma</m-button>
    </m-column>
    <m-button variant="ghost" @click="selected = (selected + 1) % alignments.length"
      >Align: {{ alignments[selected] }}</m-button
    >
  </m-column>
</template>
