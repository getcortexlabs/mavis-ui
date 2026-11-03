<script setup lang="ts">
import { ref } from 'vue'
import { useCatalogLocale } from '../locale'
const { locale } = useCatalogLocale()
const draft = ref('')
</script>
<template>
  <m-grid :columns="3" :min-column-width="180" gap="md">
    <m-card v-for="number in 3" :key="number" padding="md">
      <m-text variant="heading">{{ locale === 'pt' ? 'Ideia' : 'Idea' }} {{ number }}</m-text>
      <m-input
        v-if="number === 1"
        v-model="draft"
        :label="locale === 'pt' ? 'Seu rascunho' : 'Your draft'"
      />
      <m-text v-else>{{ locale === 'pt' ? 'Espaço para criar.' : 'Room to create.' }}</m-text>
    </m-card>
  </m-grid>
</template>
