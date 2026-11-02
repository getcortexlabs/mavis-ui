<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref } from 'vue'

const { t } = useCatalogLocale()

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const volume = ref(35)
const temperature = ref(21)
</script>

<template>
  <m-column gap="lg">
    <m-column gap="xs">
      <m-row justify="between">
        <m-text>{{ t('Volume') }}</m-text
        ><m-text tone="primary">{{ t(volume) }}%</m-text>
      </m-row>
      <m-slider v-model="volume" :step="5" :label="t('Volume')" />
    </m-column>
    <m-column gap="xs">
      <m-row justify="between">
        <m-text>{{ t(lang === 'pt' ? 'Temperatura' : 'Temperature') }}</m-text>
        <m-text tone="primary">{{ t(temperature) }}°</m-text>
      </m-row>
      <m-slider
        v-model="temperature"
        :min="16"
        :max="28"
        :step="0.5"
        :label="t(lang === 'pt' ? 'Temperatura' : 'Temperature')"
      />
    </m-column>
    <m-slider
      :modelValue="60"
      disabled
      :label="t(lang === 'pt' ? 'Controle desabilitado' : 'Disabled control')"
    />
  </m-column>
</template>
