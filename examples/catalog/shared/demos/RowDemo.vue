<script setup lang="ts">
import { ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import type { Space } from '@getcortexlabs/mavis-core'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const { theme } = useMavisTheme()
const gaps: Space[] = ['sm', 'md', 'lg']
const selected = ref(1)
</script>

<template>
  <m-column gap="lg">
    <m-row :gap="gaps[selected]">
      <m-column
        v-for="label in ['A', 'B', 'C']"
        :key="label"
        :grow="1"
        padding="md"
        radius="sm"
        :backgroundColor="theme.colors.elevated"
      >
        <m-text align="center" tone="primary">{{ label }}</m-text>
      </m-column>
    </m-row>
    <m-button variant="secondary" @click="selected = (selected + 1) % gaps.length"
      >Gap: {{ gaps[selected] }}</m-button
    >
  </m-column>
</template>
