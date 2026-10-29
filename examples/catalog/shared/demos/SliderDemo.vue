<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const volume = ref(35)
const temperature = ref(21)
</script>

<template>
  <m-column gap="lg">
    <m-column gap="xs">
      <m-row justify="between">
        <m-text>Volume</m-text><m-text tone="primary">{{ volume }}%</m-text>
      </m-row>
      <m-slider v-model="volume" :step="5" label="Volume" />
    </m-column>
    <m-column gap="xs">
      <m-row justify="between">
        <m-text>{{ lang === 'pt' ? 'Temperatura' : 'Temperature' }}</m-text>
        <m-text tone="primary">{{ temperature }}°</m-text>
      </m-row>
      <m-slider
        v-model="temperature"
        :min="16"
        :max="28"
        :step="0.5"
        :label="lang === 'pt' ? 'Temperatura' : 'Temperature'"
      />
    </m-column>
    <m-slider
      :modelValue="60"
      disabled
      :label="lang === 'pt' ? 'Controle desabilitado' : 'Disabled control'"
    />
  </m-column>
</template>
